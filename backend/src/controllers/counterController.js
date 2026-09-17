import pool from "../config/db.js";

export const getCounterOrders = async (req, res) => {
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
                o.payment_method,
                o.payment_status,
                o.payment_transaction_id,
                o.created_at
             FROM orders o
             JOIN users u ON o.user_id = u.id
             JOIN canteens c ON o.canteen_id = c.id
             WHERE o.status IN ('ready', 'completed')
             ORDER BY o.created_at DESC`
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

        const ordersWithItems = orders.map((o) => ({
            ...o,
            items: itemsByOrderId[o.id] || []
        }));

        res.json({
            success: true,
            orders: ordersWithItems
        });

    } catch (error) {
        console.error("Get counter orders error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch counter orders"
        });
    }
};

export const markOrderCollected = async (req, res) => {
    try {
        const { id } = req.params;
        const { canteenId } = req.body;

        const [orders] = await pool.query(
            "SELECT id, token_number, canteen_id, user_id, status FROM orders WHERE id = ?",
            [id]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        const order = orders[0];
        const user = req.user;
        const staffCanteenId = user?.canteen_id || req.headers["x-canteen-id"] || canteenId;

        // Mandatory server-side canteen authorization for counter staff
        if (user?.role === "counter" && staffCanteenId) {
            if (Number(order.canteen_id) !== Number(staffCanteenId)) {
                return res.status(403).json({
                    success: false,
                    message: `Unauthorized: Counter staff is not authorized to collect orders for Canteen #${order.canteen_id} (Assigned: Canteen #${staffCanteenId})`
                });
            }
        }

        // Prevent double collection
        if (order.status === "completed") {
            return res.status(400).json({
                success: false,
                message: `Token #${order.token_number} has already been collected and completed.`
            });
        }

        // Must be in 'ready' status to collect
        if (order.status !== "ready") {
            return res.status(400).json({
                success: false,
                message: `Cannot collect order #${order.id} with status '${order.status}'. Food must be marked 'ready' by kitchen first.`
            });
        }

        // Atomic update to avoid race conditions
        const [result] = await pool.query(
            `UPDATE orders
             SET status = 'completed'
             WHERE id = ? AND status = 'ready'`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(409).json({
                success: false,
                message: "Order could not be collected. It may have already been collected concurrently or is no longer ready."
            });
        }

        const io = req.app.get("io");
        if (io) {
            // Scoped emissions only - no unauthenticated global broadcasts
            io.to(`order_${id}`).emit("orderStatusUpdated", {
                orderId: Number(id),
                status: "completed"
            });
            io.to(`canteen_${order.canteen_id}`).emit("orderStatusUpdated", {
                orderId: Number(id),
                status: "completed"
            });
        }

        res.json({
            success: true,
            message: `Token #${order.token_number} verified and marked as collected/completed`,
            orderId: Number(id),
            tokenNumber: order.token_number,
            status: "completed"
        });

    } catch (error) {
        console.error("Mark order collected error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to mark order collected"
        });
    }
};
