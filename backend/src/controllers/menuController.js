import pool from "../config/db.js";

export const getMenuItems = async (req, res) => {
    try {
        const { canteenId } = req.params;

        const [items] = await pool.query(
            `SELECT * FROM menu_items
             WHERE canteen_id = ? AND is_available = TRUE
             ORDER BY category, id`,
            [canteenId]
        );

        res.json({
            success: true,
            items
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch menu items"
        });
    }
};