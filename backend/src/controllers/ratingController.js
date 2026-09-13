import pool from "../config/db.js";

export const addRating = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orderId, rating, review } = req.body;

        if (!orderId || !rating) {
            return res.status(400).json({
                success: false,
                message: "Order ID and rating are required"
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5"
            });
        }

        const [orders] = await pool.query(
            `SELECT id, status
             FROM orders
             WHERE id = ? AND user_id = ?`,
            [orderId, userId]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        if (orders[0].status !== "completed") {
            return res.status(400).json({
                success: false,
                message: "You can rate only completed orders"
            });
        }

        const [existingRatings] = await pool.query(
            `SELECT id
             FROM ratings
             WHERE order_id = ? AND user_id = ?`,
            [orderId, userId]
        );

        if (existingRatings.length > 0) {
            return res.status(409).json({
                success: false,
                message: "You have already rated this order"
            });
        }

        const [result] = await pool.query(
            `INSERT INTO ratings
             (user_id, order_id, rating, review)
             VALUES (?, ?, ?, ?)`,
            [userId, orderId, rating, review || null]
        );

        res.status(201).json({
            success: true,
            message: "Rating added successfully",
            ratingId: result.insertId
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to add rating"
        });
    }
};

export const getRatings = async (req, res) => {
    try {
        const [ratings] = await pool.query(
            `SELECT
                r.id,
                r.user_id,
                u.name AS user_name,
                r.order_id,
                r.rating,
                r.review,
                r.created_at
             FROM ratings r
             JOIN users u ON r.user_id = u.id
             ORDER BY r.created_at DESC`
        );

        res.json({
            success: true,
            ratings
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch ratings"
        });
    }
};
