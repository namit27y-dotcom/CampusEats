import express from "express";
import { getAiRecommendations } from "../controllers/aiController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/recommend", authMiddleware, getAiRecommendations);

export default router;
