import pool from "../config/db.js";

export const createOrder = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const userId = req.user.id;
        const { canteenId, items, paymentMethod } = req.body;

        if (!canteenId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Canteen and items are required"
            });
        }

        const selectedPaymentMethod = paymentMethod || "wallet";

        if (!["upi", "wallet", "card", "cash"].includes(selectedPaymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method"
            });
        }

        await connection.beginTransaction();

        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            if (!item.menuItemId || !item.quantity || item.quantity <= 0) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: "Invalid order item"
                });
            }

            const [menuItems] = await connection.query(
                `SELECT id, name, price, is_available
                 FROM menu_items
                 WHERE id = ? AND canteen_id = ?`,
                [item.menuItemId, canteenId]
            );

            if (menuItems.length === 0 || !menuItems[0].is_available) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: `Menu item ${item.menuItemId} is not available`
                });
            }

            const basePrice = Number(menuItems[0].price);
            const quantity = Number(item.quantity);
            const extraAmount = Math.max(0, Number(item.extraAmount || 0));

            if (extraAmount > 100) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: "Invalid customization amount"
                });
            }

            const unitPrice = basePrice + extraAmount;

            subtotal += unitPrice * quantity;

            orderItems.push({
                menuItemId: item.menuItemId,
                quantity,
                price: unitPrice,
                extraAmount,
                customization: item.customization || null
            });
        }

        const discount = subtotal >= 100 ? 15 : 0;
        const taxes = 0;
        const totalAmount = Math.max(0, subtotal - discount + taxes);

        const tokenNumber = `T${Date.now().toString().slice(-6)}`;

        let paymentStatus = "pending";
        let paymentTransactionId = null;
        let walletBalance = null;

        if (selectedPaymentMethod === "wallet") {
            const [users] = await connection.query(
                `SELECT wallet_balance
                 FROM users
                 WHERE id = ?
                 FOR UPDATE`,
                [userId]
            );

            if (users.length === 0) {
                await connection.rollback();

                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }

            walletBalance = Number(users[0].wallet_balance);

            if (walletBalance < totalAmount) {
                await connection.rollback();

                return res.status(400).json({
                    success: false,
                    message: "Insufficient wallet balance",
                    walletBalance,
                    requiredAmount: totalAmount
                });
            }

            await connection.query(
                `UPDATE users
                 SET wallet_balance = wallet_balance - ?
                 WHERE id = ?`,
                [totalAmount, userId]
            );

            walletBalance -= totalAmount;
            paymentStatus = "paid";
            paymentTransactionId = `CW-WALLET-${Date.now()}`;

            await connection.query(
                `INSERT INTO wallet_transactions
                (user_id, amount, type, description)
                VALUES (?, ?, 'debit', ?)`,
                [
                    userId,
                    totalAmount,
                    `Payment for order`
                ]
            );
        }

        if (selectedPaymentMethod === "upi") {
            paymentStatus = "paid";
            paymentTransactionId = `DEMO-UPI-${Date.now()}`;
        }

        if (selectedPaymentMethod === "card") {
            paymentStatus = "paid";
            paymentTransactionId = `DEMO-CARD-${Date.now()}`;
        }

        if (selectedPaymentMethod === "cash") {
            paymentStatus = "pending";
            paymentTransactionId = null;
        }

        const [orderResult] = await connection.query(
            `INSERT INTO orders
            (
                user_id,
                canteen_id,
                total_amount,
                token_number,
                status,
                payment_method,
                payment_status,
                payment_transaction_id
            )
            VALUES (?, ?, ?, ?, 'placed', ?, ?, ?)`,
            [
                userId,
                canteenId,
                totalAmount,
                tokenNumber,
                selectedPaymentMethod,
                paymentStatus,
                paymentTransactionId
            ]
        );

        const orderId = orderResult.insertId;

        for (const item of orderItems) {
            await connection.query(
                `INSERT INTO order_items
                (
                    order_id,
                    menu_item_id,
                    quantity,
                    price,
                    customization,
                    extra_amount
                )
                VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    item.menuItemId,
                    item.quantity,
                    item.price,
                    item.customization,
                    item.extraAmount
                ]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order: {
                id: orderId,
                tokenNumber,
                subtotal,
                discount,
                taxes,
                totalAmount,
                status: "placed",
                paymentMethod: selectedPaymentMethod,
                paymentStatus,
                paymentTransactionId
            },
            walletBalance
        });

    } catch (error) {
        await connection.rollback();

        console.error("Create order error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to place order"
        });
    } finally {
        connection.release();
    }
};

export const getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        const [orders] = await pool.query(
            `SELECT
                o.id,
                o.canteen_id,
                c.name AS canteen_name,
                o.total_amount,
                o.token_number,
                o.status,
                o.payment_method,
                o.payment_status,
                o.payment_transaction_id,
                o.created_at
             FROM orders o
             JOIN canteens c ON o.canteen_id = c.id
             WHERE o.user_id = ?
             ORDER BY o.created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            orders
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch orders"
        });
    }
};
