import express from "express";
import {
    getAdminStats,
    getAdminUsers,
    getAdminOrders
} from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/stats", authMiddleware, roleMiddleware("admin"), getAdminStats);
router.get("/users", authMiddleware, roleMiddleware("admin"), getAdminUsers);
router.get("/orders", authMiddleware, roleMiddleware("admin"), getAdminOrders);

export default router;
