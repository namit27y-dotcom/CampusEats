import express from "express";
import {
    getKitchenOrders,
    updateOrderStatus
} from "../controllers/kitchenController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
    "/orders",
    authMiddleware,
    roleMiddleware("kitchen", "admin"),
    getKitchenOrders
);

router.patch(
    "/orders/:id/status",
    authMiddleware,
    roleMiddleware("kitchen", "admin"),
    updateOrderStatus
);

export default router;
