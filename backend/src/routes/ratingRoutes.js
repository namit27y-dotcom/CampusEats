import express from "express";
import {
    addRating,
    getRatings
} from "../controllers/ratingController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, addRating);
router.get("/", getRatings);

export default router;
