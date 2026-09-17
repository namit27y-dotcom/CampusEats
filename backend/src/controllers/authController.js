import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const register = async (req, res) => {
    try {
        let { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });
        }

        name = String(name).trim();
        email = String(email).trim().toLowerCase();

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email format"
            });
        }

        // 1. Password strength validation:
        // - Minimum 8 characters
        // - At least one numeric digit
        // - At least one special character
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long"
            });
        }

        const hasNumber = /\d/.test(password);
        if (!hasNumber) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least one numeric digit"
            });
        }

        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password);
        if (!hasSpecialChar) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least one special character (e.g. !@#$%^&*)"
            });
        }

        // 2. Strict Role Policy: Public registration is ALWAYS 'student'
        // Staff and Admin accounts cannot be self-assigned via public registration
        const assignedRole = "student";

        const [existingUsers] = await pool.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await pool.query(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            [name, email, hashedPassword, assignedRole]
        );

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            userId: result.insertId,
            role: assignedRole
        });

    } catch (error) {
        console.error("Registration error:", error);

        res.status(500).json({
            success: false,
            message: "Registration failed"
        });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const [users] = await pool.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                canteen_id: user.canteen_id || null
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                canteen_id: user.canteen_id || null,
                wallet_balance: user.wallet_balance
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};

export const getMe = async (req, res) => {
    try {
        const [users] = await pool.query(
            "SELECT id, name, email, role, wallet_balance FROM users WHERE id = ?",
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            message: "Authenticated user",
            user: users[0]
        });
    } catch (error) {
        console.error("Get /me error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch user profile"
        });
    }
};