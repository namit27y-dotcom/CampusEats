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

export const addMenuItem = async (req, res) => {
    try {
        const { canteenId, name, description, price, category, imageUrl, isAvailable } = req.body;

        if (!canteenId || !name || price === undefined) {
            return res.status(400).json({
                success: false,
                message: "Canteen ID, name, and price are required"
            });
        }

        const [result] = await pool.query(
            `INSERT INTO menu_items
             (canteen_id, name, description, price, category, image_url, is_available)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                canteenId,
                name,
                description || null,
                price,
                category || "snacks",
                imageUrl || null,
                isAvailable !== undefined ? Boolean(isAvailable) : true
            ]
        );

        res.status(201).json({
            success: true,
            message: "Menu item added successfully",
            itemId: result.insertId
        });

    } catch (error) {
        console.error("Add menu item error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add menu item"
        });
    }
};

export const updateMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, category, imageUrl, isAvailable } = req.body;

        const [result] = await pool.query(
            `UPDATE menu_items
             SET name = COALESCE(?, name),
                 description = COALESCE(?, description),
                 price = COALESCE(?, price),
                 category = COALESCE(?, category),
                 image_url = COALESCE(?, image_url),
                 is_available = COALESCE(?, is_available)
             WHERE id = ?`,
            [name, description, price, category, imageUrl, isAvailable, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found"
            });
        }

        res.json({
            success: true,
            message: "Menu item updated successfully"
        });

    } catch (error) {
        console.error("Update menu item error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update menu item"
        });
    }
};

export const toggleAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { isAvailable } = req.body;

        const [result] = await pool.query(
            `UPDATE menu_items
             SET is_available = ?
             WHERE id = ?`,
            [Boolean(isAvailable), id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found"
            });
        }

        res.json({
            success: true,
            message: "Menu item availability updated",
            isAvailable: Boolean(isAvailable)
        });

    } catch (error) {
        console.error("Toggle availability error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update availability"
        });
    }
};

export const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { stockQuantity, isTracked, isAvailable } = req.body;

        if (stockQuantity !== undefined && (isNaN(stockQuantity) || Number(stockQuantity) < 0)) {
            return res.status(400).json({
                success: false,
                message: "Stock quantity must be a non-negative number"
            });
        }

        const [items] = await pool.query(
            "SELECT id, name, is_available, stock_quantity, is_tracked FROM menu_items WHERE id = ?",
            [id]
        );

        if (items.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Menu item not found"
            });
        }

        const item = items[0];
        const newStock = stockQuantity !== undefined ? Number(stockQuantity) : Number(item.stock_quantity || 100);
        const newTracked = isTracked !== undefined ? (Boolean(isTracked) ? 1 : 0) : Number(item.is_tracked || 0);
        let newAvailable = isAvailable !== undefined ? (Boolean(isAvailable) ? 1 : 0) : Number(item.is_available);

        // If stock is 0 and tracked is on, auto disable availability
        if (newTracked === 1 && newStock === 0) {
            newAvailable = 0;
        } else if (newStock > 0 && isAvailable === undefined && item.is_available === 0) {
            newAvailable = 1;
        }

        await pool.query(
            `UPDATE menu_items
             SET stock_quantity = ?,
                 is_tracked = ?,
                 is_available = ?
             WHERE id = ?`,
            [newStock, newTracked, newAvailable, id]
        );

        res.json({
            success: true,
            message: `Stock updated for '${item.name}'`,
            data: {
                id: Number(id),
                stockQuantity: newStock,
                isTracked: Boolean(newTracked),
                isAvailable: Boolean(newAvailable)
            }
        });

    } catch (error) {
        console.error("Update stock error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update stock"
        });
    }
};