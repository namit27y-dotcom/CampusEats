import express from "express";
import {
    getWalletBalance,
    addMoney
} from "../controllers/walletController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/balance", authMiddleware, getWalletBalance);
router.post("/add-money", authMiddleware, addMoney);

export default router;
