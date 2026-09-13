import pool from "../config/db.js";

export const createOrder = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const userId = req.user.id;
        const { canteenId, items } = req.body;

        if (!canteenId || !items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Canteen and items are required"
            });
        }

        await connection.beginTransaction();

        let totalAmount = 0;
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
                `SELECT id, price, is_available
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

            const price = Number(menuItems[0].price);
            const quantity = Number(item.quantity);

            totalAmount += price * quantity;

            orderItems.push({
                menuItemId: item.menuItemId,
                quantity,
                price
            });
        }

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

        const walletBalance = Number(users[0].wallet_balance);

        if (walletBalance < totalAmount) {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Insufficient wallet balance",
                walletBalance,
                requiredAmount: totalAmount
            });
        }

        const tokenNumber = `T${Date.now().toString().slice(-6)}`;

        const [orderResult] = await connection.query(
            `INSERT INTO orders
            (user_id, canteen_id, total_amount, token_number)
            VALUES (?, ?, ?, ?)`,
            [userId, canteenId, totalAmount, tokenNumber]
        );

        const orderId = orderResult.insertId;

        for (const item of orderItems) {
            await connection.query(
                `INSERT INTO order_items
                (order_id, menu_item_id, quantity, price)
                VALUES (?, ?, ?, ?)`,
                [
                    orderId,
                    item.menuItemId,
                    item.quantity,
                    item.price
                ]
            );
        }

        await connection.query(
            `UPDATE users
             SET wallet_balance = wallet_balance - ?
             WHERE id = ?`,
            [totalAmount, userId]
        );

        await connection.query(
            `INSERT INTO wallet_transactions
            (user_id, amount, type, description)
            VALUES (?, ?, 'debit', ?)`,
            [
                userId,
                totalAmount,
                `Payment for order #${orderId}`
            ]
        );

        const newWalletBalance = walletBalance - totalAmount;

        await connection.commit();

        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order: {
                id: orderId,
                tokenNumber,
                totalAmount,
                status: "placed"
            },
            walletBalance: newWalletBalance
        });

    } catch (error) {
        await connection.rollback();

        console.error(error);

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
