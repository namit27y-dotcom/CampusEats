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

        const io = req.app.get("io");
        if (io) {
            try {
                const [createdOrders] = await pool.query(
                    `SELECT
                        o.id,
                        o.user_id,
                        u.name AS student_name,
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
                     JOIN users u ON o.user_id = u.id
                     JOIN canteens c ON o.canteen_id = c.id
                     WHERE o.id = ?`,
                    [orderId]
                );

                if (createdOrders.length > 0) {
                    io.emit("newOrderCreated", {
                        ...createdOrders[0],
                        items: orderItems
                    });
                }
            } catch (broadcastErr) {
                console.error("Socket broadcast error:", broadcastErr);
            }
        }

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
                o.created_at,
                r.rating AS user_rating,
                r.review AS user_review
             FROM orders o
             JOIN canteens c ON o.canteen_id = c.id
             LEFT JOIN ratings r ON o.id = r.order_id AND r.user_id = o.user_id
             WHERE o.user_id = ?
             ORDER BY o.created_at DESC`,
            [userId]
        );

        if (orders.length === 0) {
            return res.json({
                success: true,
                orders: []
            });
        }

        const orderIds = orders.map((o) => o.id);
        const [orderItems] = await pool.query(
            `SELECT
                oi.id,
                oi.order_id,
                oi.menu_item_id,
                oi.quantity,
                oi.price,
                oi.customization,
                oi.extra_amount,
                m.name,
                m.is_available
             FROM order_items oi
             JOIN menu_items m ON oi.menu_item_id = m.id
             WHERE oi.order_id IN (?)`,
            [orderIds]
        );

        const itemsByOrderId = {};
        for (const item of orderItems) {
            if (!itemsByOrderId[item.order_id]) {
                itemsByOrderId[item.order_id] = [];
            }
            itemsByOrderId[item.order_id].push({
                id: item.id,
                menu_item_id: item.menu_item_id,
                name: item.name,
                quantity: Number(item.quantity),
                price: Number(item.price),
                customization: item.customization,
                extra_amount: Number(item.extra_amount || 0)
            });
        }

        const ordersWithDetails = orders.map((o) => ({
            ...o,
            items: itemsByOrderId[o.id] || []
        }));

        res.json({
            success: true,
            orders: ordersWithDetails
        });

    } catch (error) {
        console.error("Get my orders error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch orders"
        });
    }
};

export const cancelOrder = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        const { id } = req.params;

        await connection.beginTransaction();

        const [orders] = await connection.query(
            `SELECT * FROM orders WHERE id = ? FOR UPDATE`,
            [id]
        );

        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const order = orders[0];

        // Ownership verification: student cannot cancel another student's order
        if (userRole === "student" && order.user_id !== userId) {
            await connection.rollback();
            return res.status(403).json({
                success: false,
                message: "Access denied. You cannot cancel another student's order."
            });
        }

        if (order.status === "cancelled") {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: "Order is already cancelled"
            });
        }

        // Cancellation eligibility check
        if (["preparing", "ready", "completed"].includes(order.status)) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: `Cannot cancel order in '${order.status}' status. Food is already in preparation or completed.`
            });
        }

        // Wallet refund processing
        let refundProcessed = false;
        let newWalletBalance = null;

        if (order.payment_method === "wallet" && order.payment_status === "paid") {
            const refundDescription = `Refund for cancelled order #${order.id} (Token ${order.token_number})`;
            const [existingRefund] = await connection.query(
                `SELECT id FROM wallet_transactions
                 WHERE user_id = ? AND description LIKE ?`,
                [order.user_id, `%#${order.id}%`]
            );

            if (existingRefund.length === 0) {
                const [userRows] = await connection.query(
                    `SELECT wallet_balance FROM users WHERE id = ? FOR UPDATE`,
                    [order.user_id]
                );

                if (userRows.length > 0) {
                    const refundAmount = Number(order.total_amount);
                    await connection.query(
                        `UPDATE users SET wallet_balance = wallet_balance + ? WHERE id = ?`,
                        [refundAmount, order.user_id]
                    );

                    await connection.query(
                        `INSERT INTO wallet_transactions
                         (user_id, amount, type, description)
                         VALUES (?, ?, 'credit', ?)`,
                        [order.user_id, refundAmount, refundDescription]
                    );

                    newWalletBalance = Number(userRows[0].wallet_balance) + refundAmount;
                    refundProcessed = true;
                }
            }
        }

        // Update status to cancelled (preserving enum on payment_status)
        await connection.query(
            `UPDATE orders SET status = 'cancelled' WHERE id = ?`,
            [id]
        );

        await connection.commit();

        // Emit Socket.IO event
        const io = req.app.get("io");
        if (io) {
            io.to(`order_${id}`).emit("orderStatusUpdated", {
                orderId: Number(id),
                status: "cancelled"
            });
            io.emit("orderStatusUpdated", {
                orderId: Number(id),
                status: "cancelled"
            });
        }

        res.json({
            success: true,
            message: "Order cancelled successfully",
            orderId: Number(id),
            status: "cancelled",
            refundProcessed,
            walletBalance: newWalletBalance
        });

    } catch (error) {
        await connection.rollback();
        console.error("Cancel order error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to cancel order"
        });
    } finally {
        connection.release();
    }
};
