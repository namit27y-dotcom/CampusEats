import express from "express";
import {
    createRazorpayOrder,
    verifyRazorpaySignature
} from "../controllers/paymentController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-order", authMiddleware, createRazorpayOrder);
router.post("/verify-signature", authMiddleware, verifyRazorpaySignature);

export default router;
