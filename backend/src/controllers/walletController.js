import pool from "../config/db.js";

export const getWalletBalance = async (req, res) => {
    try {
        const userId = req.user.id;

        const [users] = await pool.query(
            "SELECT wallet_balance FROM users WHERE id = ?",
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            walletBalance: users[0].wallet_balance
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch wallet balance"
        });
    }
};

export const addMoney = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const userId = req.user.id;
        const { amount } = req.body;

        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({
                success: false,
                message: "Enter a valid amount"
            });
        }

        const money = Number(amount);

        await connection.beginTransaction();

        await connection.query(
            `UPDATE users
             SET wallet_balance = wallet_balance + ?
             WHERE id = ?`,
            [money, userId]
        );

        await connection.query(
            `INSERT INTO wallet_transactions
             (user_id, amount, type, description)
             VALUES (?, ?, 'credit', ?)`,
            [userId, money, "Money added to wallet"]
        );

        const [users] = await connection.query(
            "SELECT wallet_balance FROM users WHERE id = ?",
            [userId]
        );

        await connection.commit();

        res.json({
            success: true,
            message: "Money added successfully",
            walletBalance: users[0].wallet_balance
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to add money"
        });
    } finally {
        connection.release();
    }
};

export const getTransactions = async (req, res) => {
    try {
        const userId = req.user.id;

        const [transactions] = await pool.query(
            `SELECT id, user_id, amount, type, description, created_at
             FROM wallet_transactions
             WHERE user_id = ?
             ORDER BY created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            transactions
        });

    } catch (error) {
        console.error("Get transactions error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch wallet transactions"
        });
    }
};
