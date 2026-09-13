import pool from "../config/db.js";

export const getKitchenOrders = async (req, res) => {
    try {
        const [orders] = await pool.query(
            `SELECT
                o.id,
                o.user_id,
                u.name AS student_name,
                o.canteen_id,
                c.name AS canteen_name,
                o.total_amount,
                o.token_number,
                o.status,
                o.created_at
             FROM orders o
             JOIN users u ON o.user_id = u.id
             JOIN canteens c ON o.canteen_id = c.id
             WHERE o.status IN ('placed', 'accepted', 'preparing', 'ready')
             ORDER BY o.created_at ASC`
        );

        res.json({
            success: true,
            orders
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch kitchen orders"
        });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            "accepted",
            "preparing",
            "ready",
            "completed",
            "cancelled"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status"
            });
        }

        const [result] = await pool.query(
            `UPDATE orders
             SET status = ?
             WHERE id = ?`,
            [status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const io = req.app.get("io");

        io.to(`order_${id}`).emit("orderStatusUpdated", {
            orderId: Number(id),
            status
        });

        res.json({
            success: true,
            message: "Order status updated successfully",
            orderId: Number(id),
            status
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to update order status"
        });
    }
};
