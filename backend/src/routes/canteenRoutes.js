import express from "express";
import {
    getCanteens,
    getCanteenById
} from "../controllers/canteenController.js";

const router = express.Router();

router.get("/", getCanteens);
router.get("/:id", getCanteenById);

export default router;