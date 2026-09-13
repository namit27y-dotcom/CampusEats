import express from "express";
import {
    getWalletBalance,
    addMoney,
    getTransactions
} from "../controllers/walletController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/balance", authMiddleware, getWalletBalance);
router.post("/add-money", authMiddleware, addMoney);
router.get("/transactions", authMiddleware, getTransactions);

export default router;
