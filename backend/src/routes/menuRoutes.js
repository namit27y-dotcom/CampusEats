import express from "express";
import { getMenuItems } from "../controllers/menuController.js";

const router = express.Router();

router.get("/:canteenId", getMenuItems);

export default router;