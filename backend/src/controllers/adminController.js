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
        const [[cancelledCount]] = await pool.query(
            "SELECT COUNT(*) AS cancelledOrders FROM orders WHERE status = 'cancelled'"
        );
        const [[todayCount]] = await pool.query(
            "SELECT COUNT(*) AS todayOrders, COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0) AS todayRevenue FROM orders WHERE DATE(created_at) = CURRENT_DATE()"
        );
        const [[usersCount]] = await pool.query("SELECT COUNT(*) AS totalUsers FROM users");

        res.json({
            success: true,
            stats: {
                totalOrders: Number(ordersCount.totalOrders || 0),
                totalRevenue: Number(revenueCount.totalRevenue || 0),
                activeOrders: Number(activeCount.activeOrders || 0),
                completedOrders: Number(completedCount.completedOrders || 0),
                cancelledOrders: Number(cancelledCount.cancelledOrders || 0),
                todayOrders: Number(todayCount.todayOrders || 0),
                todayRevenue: Number(todayCount.todayRevenue || 0),
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

export const getDailySalesAnalytics = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
                DATE_FORMAT(created_at, '%Y-%m-%d') AS date,
                COUNT(*) AS total_orders,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_orders,
                COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0) AS revenue
             FROM orders
             WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
             GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
             ORDER BY date ASC`
        );

        res.json({
            success: true,
            data: rows.map(r => ({
                date: r.date,
                orders: Number(r.total_orders),
                completedOrders: Number(r.completed_orders),
                revenue: Number(r.revenue)
            }))
        });
    } catch (error) {
        console.error("Get daily sales analytics error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch daily sales analytics"
        });
    }
};

export const getPeakHoursAnalytics = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
                HOUR(created_at) AS hour,
                COUNT(*) AS order_count,
                COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_amount ELSE 0 END), 0) AS revenue
             FROM orders
             GROUP BY HOUR(created_at)
             ORDER BY hour ASC`
        );

        res.json({
            success: true,
            data: rows.map(r => ({
                hour: Number(r.hour),
                orderCount: Number(r.order_count),
                revenue: Number(r.revenue)
            }))
        });
    } catch (error) {
        console.error("Get peak hours analytics error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch peak hours analytics"
        });
    }
};

export const getTopDishesAnalytics = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
                m.id,
                m.name,
                COALESCE(m.category, 'General') AS category,
                SUM(oi.quantity) AS total_sold,
                COALESCE(SUM(oi.quantity * oi.price), 0) AS total_revenue
             FROM order_items oi
             JOIN menu_items m ON oi.menu_item_id = m.id
             JOIN orders o ON oi.order_id = o.id
             WHERE o.status != 'cancelled'
             GROUP BY m.id, m.name, m.category
             ORDER BY total_sold DESC
             LIMIT 10`
        );

        res.json({
            success: true,
            data: rows.map(r => ({
                id: r.id,
                name: r.name,
                category: r.category,
                totalSold: Number(r.total_sold),
                totalRevenue: Number(r.total_revenue)
            }))
        });
    } catch (error) {
        console.error("Get top dishes analytics error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch top dishes analytics"
        });
    }
};

export const getCanteensAnalytics = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
                c.id,
                c.name,
                c.location,
                COUNT(o.id) AS total_orders,
                COUNT(CASE WHEN o.status IN ('placed', 'accepted', 'preparing', 'ready') THEN 1 END) AS active_orders,
                COUNT(CASE WHEN o.status = 'completed' THEN 1 END) AS completed_orders,
                COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total_amount ELSE 0 END), 0) AS total_revenue
             FROM canteens c
             LEFT JOIN orders o ON c.id = o.canteen_id
             GROUP BY c.id, c.name, c.location
             ORDER BY total_revenue DESC`
        );

        res.json({
            success: true,
            data: rows.map(r => ({
                id: r.id,
                name: r.name,
                location: r.location,
                totalOrders: Number(r.total_orders),
                activeOrders: Number(r.active_orders),
                completedOrders: Number(r.completed_orders),
                totalRevenue: Number(r.total_revenue)
            }))
        });
    } catch (error) {
        console.error("Get canteens analytics error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch canteens analytics"
        });
    }
};

export const getFulfillmentAnalytics = async (req, res) => {
    try {
        const [[ordersData]] = await pool.query(
            `SELECT 
                COUNT(CASE WHEN status = 'completed' THEN 1 END) AS total_completed,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS total_cancelled,
                COUNT(*) AS total_processed
             FROM orders`
        );

        // Calculate average preparation time from menu items or available timestamps
        const [[prepTimeData]] = await pool.query(
            `SELECT AVG(m.prep_time) AS avg_estimated_prep_time
             FROM order_items oi
             JOIN menu_items m ON oi.menu_item_id = m.id
             JOIN orders o ON oi.order_id = o.id
             WHERE o.status = 'completed'`
        );

        res.json({
            success: true,
            data: {
                totalCompleted: Number(ordersData.total_completed || 0),
                totalCancelled: Number(ordersData.total_cancelled || 0),
                totalProcessed: Number(ordersData.total_processed || 0),
                completionRate: ordersData.total_processed > 0 
                    ? Number(((ordersData.total_completed / ordersData.total_processed) * 100).toFixed(1)) 
                    : 0,
                avgPrepTimeMinutes: Number(prepTimeData.avg_estimated_prep_time || 8)
            }
        });
    } catch (error) {
        console.error("Get fulfillment analytics error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch fulfillment analytics"
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
