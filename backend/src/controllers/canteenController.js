import pool from "../config/db.js";

export const getCanteens = async (req, res) => {
    try {
        const [canteens] = await pool.query(
            "SELECT * FROM canteens WHERE is_active = TRUE ORDER BY id DESC"
        );

        res.json({
            success: true,
            canteens
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch canteens"
        });
    }
};

export const getCanteenById = async (req, res) => {
    try {
        const { id } = req.params;

        const [canteens] = await pool.query(
            "SELECT * FROM canteens WHERE id = ? AND is_active = TRUE",
            [id]
        );

        if (canteens.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Canteen not found"
            });
        }

        res.json({
            success: true,
            canteen: canteens[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch canteen"
        });
    }
};
