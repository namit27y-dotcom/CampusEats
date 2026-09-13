import pool from "../config/db.js";

export const getAdminStats = async (req, res) => {
    try {
        const [[ordersCount]] = await pool.query("SELECT COUNT(*) AS totalOrders FROM orders");
        const [[revenueCount]] = await pool.query(
            "SELECT COALESCE(SUM(total_amount), 0) AS totalRevenue FROM orders WHERE status != 'cancelled'"
        );
        const [[activeCount]] = await pool.query(
            "SELECT COUNT(*) AS activeOrders FROM orders WHERE status IN ('placed', 'accepted', 'preparing', 'ready')"
        );
        const [[completedCount]] = await pool.query(
            "SELECT COUNT(*) AS completedOrders FROM orders WHERE status = 'completed'"
        );
        const [[usersCount]] = await pool.query("SELECT COUNT(*) AS totalUsers FROM users");

        res.json({
            success: true,
            stats: {
                totalOrders: Number(ordersCount.totalOrders || 0),
                totalRevenue: Number(revenueCount.totalRevenue || 0),
                activeOrders: Number(activeCount.activeOrders || 0),
                completedOrders: Number(completedCount.completedOrders || 0),
                totalUsers: Number(usersCount.totalUsers || 0)
            }
        });
    } catch (error) {
        console.error("Get admin stats error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch admin stats"
        });
    }
};

export const getAdminUsers = async (req, res) => {
    try {
        const [users] = await pool.query(
            "SELECT id, name, email, role, wallet_balance, created_at FROM users ORDER BY id DESC"
        );

        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error("Get admin users error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch admin users"
        });
    }
};

export const getAdminOrders = async (req, res) => {
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
                m.name
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
        console.error("Get admin orders error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch admin orders"
        });
    }
};
