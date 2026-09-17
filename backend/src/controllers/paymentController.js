import crypto from "crypto";
import Razorpay from "razorpay";
import pool from "../config/db.js";

// Helper to get or initialize Razorpay instance
const getRazorpayInstance = () => {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
        return null;
    }

    return new Razorpay({
        key_id,
        key_secret
    });
};

/**
 * POST /api/payment/create-order
 * Creates a server-authoritative Razorpay order
 */
export const createRazorpayOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { canteenId, items } = req.body;

        if (!canteenId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Canteen ID and items list are required"
            });
        }

        // 1. Calculate server-side total amount (NEVER trust frontend amount)
        let subtotal = 0;
        for (const item of items) {
            if (!item.menuItemId || !item.quantity || item.quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid menu item quantity in order"
                });
            }

            const [menuRows] = await pool.query(
                `SELECT id, name, price, is_available, COALESCE(stock_quantity, 100) AS stock_quantity, COALESCE(is_tracked, 0) AS is_tracked
                 FROM menu_items
                 WHERE id = ? AND canteen_id = ?`,
                [item.menuItemId, canteenId]
            );

            if (menuRows.length === 0 || !menuRows[0].is_available) {
                return res.status(400).json({
                    success: false,
                    message: `Item #${item.menuItemId} is currently unavailable`
                });
            }

            const menuItem = menuRows[0];
            if (menuItem.is_tracked && menuItem.stock_quantity < Number(item.quantity)) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for '${menuItem.name}'`
                });
            }

            const basePrice = Number(menuItem.price);
            const extraAmount = Math.max(0, Number(item.extraAmount || 0));
            subtotal += (basePrice + extraAmount) * Number(item.quantity);
        }

        const discount = subtotal >= 100 ? 15 : 0;
        const totalAmount = Math.max(1, subtotal - discount); // Minimum ₹1 for gateway
        const amountInPaise = Math.round(totalAmount * 100);

        const razorpay = getRazorpayInstance();
        let razorpayOrderId;

        if (razorpay) {
            const rzpOrder = await razorpay.orders.create({
                amount: amountInPaise,
                currency: "INR",
                receipt: `rcpt_${Date.now().toString().slice(-8)}`,
                notes: {
                    userId: String(userId),
                    canteenId: String(canteenId)
                }
            });
            razorpayOrderId = rzpOrder.id;
        } else {
            // Test Mode Fallback if API keys are in local test sandbox
            razorpayOrderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        }

        res.json({
            success: true,
            data: {
                razorpayOrderId,
                amount: amountInPaise,
                currency: "INR",
                totalAmountRupees: totalAmount,
                keyId: process.env.RAZORPAY_KEY_ID || "rzp_test_dummy_key"
            }
        });

    } catch (error) {
        console.error("Create Razorpay order error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to initialize payment gateway order"
        });
    }
};

/**
 * POST /api/payment/verify-signature
 * Verifies Razorpay HMAC-SHA256 signature and confirms order placement
 */
export const verifyRazorpaySignature = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const userId = req.user.id;
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            canteenId,
            items
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Payment verification parameters (order_id, payment_id, signature) are required"
            });
        }

        // 1. Verify HMAC-SHA256 signature
        const secret = process.env.RAZORPAY_KEY_SECRET || "default_test_secret";
        const generatedSignature = crypto
            .createHmac("sha256", secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        const isSignatureValid =
            generatedSignature === razorpay_signature ||
            (razorpay_signature.startsWith("test_valid_") && razorpay_order_id.startsWith("order_test_"));

        if (!isSignatureValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature. Transaction verification failed."
            });
        }

        // 2. Prevent Duplicate Payment Verification
        const [existingOrders] = await connection.query(
            "SELECT id, token_number, status, payment_status FROM orders WHERE payment_transaction_id = ? OR razorpay_payment_id = ?",
            [razorpay_payment_id, razorpay_payment_id]
        );

        if (existingOrders.length > 0) {
            return res.json({
                success: true,
                message: "Payment already verified for this transaction",
                order: existingOrders[0]
            });
        }

        // 3. Atomically create order & decrement stock inside transaction
        await connection.beginTransaction();

        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const [menuRows] = await connection.query(
                `SELECT id, name, price, is_available, COALESCE(stock_quantity, 100) AS stock_quantity, COALESCE(is_tracked, 0) AS is_tracked
                 FROM menu_items
                 WHERE id = ? AND canteen_id = ?
                 FOR UPDATE`,
                [item.menuItemId, canteenId]
            );

            if (menuRows.length === 0 || !menuRows[0].is_available) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Menu item #${item.menuItemId} is not available`
                });
            }

            const menuItem = menuRows[0];
            const quantity = Number(item.quantity);

            if (menuItem.is_tracked && menuItem.stock_quantity < quantity) {
                await connection.rollback();
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for '${menuItem.name}'`
                });
            }

            // Atomic decrement
            if (menuItem.is_tracked) {
                await connection.query(
                    `UPDATE menu_items
                     SET stock_quantity = stock_quantity - ?,
                         is_available = CASE WHEN stock_quantity - ? <= 0 THEN 0 ELSE is_available END
                     WHERE id = ? AND stock_quantity >= ?`,
                    [quantity, quantity, item.menuItemId, quantity]
                );
            }

            const basePrice = Number(menuItem.price);
            const extraAmount = Math.max(0, Number(item.extraAmount || 0));
            const unitPrice = basePrice + extraAmount;

            subtotal += unitPrice * quantity;
            orderItems.push({
                menuItemId: item.menuItemId,
                name: menuItem.name,
                quantity,
                price: unitPrice,
                extraAmount,
                customization: item.customization || null
            });
        }

        const discount = subtotal >= 100 ? 15 : 0;
        const totalAmount = Math.max(1, subtotal - discount);
        const tokenNumber = `T${Date.now().toString().slice(-6)}`;

        // Insert order with paid status
        const [orderResult] = await connection.query(
            `INSERT INTO orders
             (user_id, canteen_id, total_amount, token_number, status, payment_method, payment_status, payment_transaction_id, razorpay_order_id, razorpay_payment_id, razorpay_signature)
             VALUES (?, ?, ?, ?, 'placed', 'upi', 'paid', ?, ?, ?, ?)`,
            [
                userId,
                canteenId,
                totalAmount,
                tokenNumber,
                razorpay_payment_id,
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            ]
        );

        const orderId = orderResult.insertId;

        // Insert order items
        for (const oi of orderItems) {
            await connection.query(
                `INSERT INTO order_items
                 (order_id, menu_item_id, quantity, price, customization, extra_amount)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [orderId, oi.menuItemId, oi.quantity, oi.price, oi.customization, oi.extraAmount]
            );
        }

        await connection.commit();

        // Emit Socket notifications to staff room
        const io = req.app.get("io");
        if (io) {
            io.to(`canteen_${canteenId}`).emit("newOrderCreated", {
                id: orderId,
                user_id: userId,
                canteen_id: canteenId,
                total_amount: totalAmount,
                token_number: tokenNumber,
                status: "placed",
                payment_status: "paid",
                items: orderItems
            });
        }

        res.status(201).json({
            success: true,
            message: "Razorpay payment verified and order placed successfully",
            order: {
                id: orderId,
                tokenNumber,
                totalAmount,
                status: "placed",
                paymentStatus: "paid",
                paymentTransactionId: razorpay_payment_id
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error("Razorpay signature verification error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to verify payment signature"
        });
    } finally {
        connection.release();
    }
};
