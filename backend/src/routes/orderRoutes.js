import express from "express";
import { createOrder, getMyOrders, cancelOrder } from "../controllers/orderController.js";
import { getOrderInvoice } from "../controllers/invoiceController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createOrder);
router.get("/my-orders", authMiddleware, getMyOrders);
router.get("/:id/invoice", authMiddleware, getOrderInvoice);
router.patch("/:id/cancel", authMiddleware, cancelOrder);
router.post("/:id/cancel", authMiddleware, cancelOrder);

export default router;
