import express from "express";
import {
    getCounterOrders,
    markOrderCollected
} from "../controllers/counterController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
    "/orders",
    authMiddleware,
    roleMiddleware("counter", "kitchen", "admin"),
    getCounterOrders
);

router.patch(
    "/orders/:id/collect",
    authMiddleware,
    roleMiddleware("counter", "kitchen", "admin"),
    markOrderCollected
);

export default router;
