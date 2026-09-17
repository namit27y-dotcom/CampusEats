import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import canteenRoutes from "./routes/canteenRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import kitchenRoutes from "./routes/kitchenRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import ratingRoutes from "./routes/ratingRoutes.js";
import counterRoutes from "./routes/counterRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// 1. Security Headers via Helmet
app.use(helmet({
    crossOriginResourcePolicy: false
}));

// 2. Rate Limiting Configuration
const generalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests from this IP address, please try again later."
    }
});

const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 authentication attempts per 15 min
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login/registration attempts from this IP, please try again in 15 minutes."
    }
});

const aiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 AI requests per 15 min
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "AI recommendation rate limit reached. Please try again shortly."
    }
});

const clientUrl = process.env.CLIENT_URL;
const allowedOrigins = clientUrl ? clientUrl.split(",").map(url => url.trim()) : "*";

const corsOptions = {
    origin: allowedOrigins,
    credentials: true
};

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true
    }
});

// Socket.IO Handshake JWT Authentication Middleware
io.use((socket, next) => {
    const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

    if (!token) {
        socket.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_jwt_secret_dev");
        socket.user = decoded;
        next();
    } catch (err) {
        console.warn(`Socket JWT auth notice [${socket.id}]:`, err.message);
        socket.user = null;
        next();
    }
});

app.set("io", io);

app.use(cors(corsOptions));
app.use(express.json());

// Apply rate limiters
app.use("/api", generalApiLimiter);
app.use("/api/auth/login", authRateLimiter);
app.use("/api/auth/register", authRateLimiter);
app.use("/api/ai", aiRateLimiter);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/canteens", canteenRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/kitchen", kitchenRoutes);
app.use("/api/counter", counterRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "CampusEats Backend is running securely"
    });
});

app.get("/api/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.json({
            success: true,
            status: "OK",
            database: "Connected",
            message: "CampusEats API is healthy"
        });
    } catch (error) {
        console.error("Health check database error:", error);

        res.status(500).json({
            success: false,
            status: "ERROR",
            database: "Disconnected",
            message: "Database connection failed"
        });
    }
});

// Socket.IO Connection & Room Authorization
io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.user?.email || "Guest"})`);

    socket.on("joinOrder", async (orderId) => {
        if (!orderId) return;

        const user = socket.user;
        if (!user) {
            // Unauthenticated client cannot join private order rooms
            return socket.emit("socketError", {
                message: "Authentication required to join order real-time updates."
            });
        }

        // Staff roles have authorized access across orders
        if (["kitchen", "counter", "admin"].includes(String(user.role).toLowerCase())) {
            socket.join(`order_${orderId}`);
            console.log(`Staff socket ${socket.id} (${user.role}) joined order_${orderId}`);
            return;
        }

        // Students can only join their own orders
        try {
            const [orders] = await pool.query(
                "SELECT user_id FROM orders WHERE id = ?",
                [orderId]
            );

            if (orders.length > 0 && orders[0].user_id === user.id) {
                socket.join(`order_${orderId}`);
                console.log(`Student socket ${socket.id} authorized for order_${orderId}`);
            } else {
                socket.emit("socketError", {
                    message: "Access denied. You can only join real-time updates for your own orders."
                });
            }
        } catch (err) {
            console.error(`Error authorizing socket joinOrder [order #${orderId}]:`, err);
        }
    });

    socket.on("joinCanteen", async (canteenId) => {
        if (!canteenId) return;

        const user = socket.user;
        if (!user) {
            return socket.emit("socketError", {
                message: "Authentication required to join canteen real-time updates."
            });
        }

        const role = String(user.role).toLowerCase();
        if (!["kitchen", "counter", "admin"].includes(role)) {
            return socket.emit("socketError", {
                message: "Unauthorized: Only authorized canteen staff can join canteen rooms."
            });
        }

        // Admin has authorized access across all canteens
        if (role === "admin") {
            socket.join(`canteen_${canteenId}`);
            console.log(`Admin socket ${socket.id} joined canteen_${canteenId}`);
            return;
        }

        // Kitchen and Counter staff: Verify server-side assigned canteen
        try {
            const [rows] = await pool.query(
                "SELECT id, role, canteen_id FROM users WHERE id = ?",
                [user.id]
            );

            const staffUser = rows.length > 0 ? rows[0] : user;
            const assignedCanteen = staffUser.canteen_id;

            if (assignedCanteen != null && assignedCanteen !== "") {
                if (String(assignedCanteen) !== String(canteenId)) {
                    console.warn(`Staff #${user.id} assigned to Canteen #${assignedCanteen} rejected from joining Canteen #${canteenId}`);
                    return socket.emit("socketError", {
                        message: `Unauthorized: Staff assigned to Canteen #${assignedCanteen} cannot join Canteen #${canteenId}.`
                    });
                }
            }

            socket.join(`canteen_${canteenId}`);
            console.log(`Staff socket ${socket.id} (${role}) authorized for canteen_${canteenId}`);
        } catch (err) {
            console.error(`Error authorizing socket joinCanteen [canteen #${canteenId}]:`, err);
            socket.join(`canteen_${canteenId}`);
        }
    });

    socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`CampusEats Backend running on http://localhost:${PORT}`);
});

