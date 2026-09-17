import express from "express";
import {
    getAdminStats,
    getDailySalesAnalytics,
    getPeakHoursAnalytics,
    getTopDishesAnalytics,
    getCanteensAnalytics,
    getFulfillmentAnalytics,
    getAdminUsers,
    getAdminOrders
} from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/stats", authMiddleware, roleMiddleware("admin"), getAdminStats);
router.get("/analytics/daily-sales", authMiddleware, roleMiddleware("admin"), getDailySalesAnalytics);
router.get("/analytics/peak-hours", authMiddleware, roleMiddleware("admin"), getPeakHoursAnalytics);
router.get("/analytics/top-dishes", authMiddleware, roleMiddleware("admin"), getTopDishesAnalytics);
router.get("/analytics/canteens", authMiddleware, roleMiddleware("admin"), getCanteensAnalytics);
router.get("/analytics/fulfillment", authMiddleware, roleMiddleware("admin"), getFulfillmentAnalytics);
router.get("/users", authMiddleware, roleMiddleware("admin"), getAdminUsers);
router.get("/orders", authMiddleware, roleMiddleware("admin"), getAdminOrders);

export default router;
