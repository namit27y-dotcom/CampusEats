import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import pool from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import canteenRoutes from "./routes/canteenRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import kitchenRoutes from "./routes/kitchenRoutes.js";
import ratingRoutes from "./routes/ratingRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.set("io", io);

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/canteens", canteenRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/kitchen", kitchenRoutes);
app.use("/api/ratings", ratingRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "CampusEats Backend is running"
    });
});

app.get("/api/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.json({
            success: true,
            status: "OK",
            database: "Connected",
            message: "CampusEats API is working"
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            status: "ERROR",
            database: "Disconnected",
            message: "Database connection failed"
        });
    }
});

io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("joinOrder", (orderId) => {
        socket.join(`order_${orderId}`);
        console.log(`Socket ${socket.id} joined order_${orderId}`);
    });

    socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`CampusEats Backend running on http://localhost:${PORT}`);
});
