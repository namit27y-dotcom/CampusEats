import express from "express";
import {
    getMenuItems,
    addMenuItem,
    updateMenuItem,
    toggleAvailability
} from "../controllers/menuController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/:canteenId", getMenuItems);
router.post("/", authMiddleware, roleMiddleware("admin"), addMenuItem);
router.put("/:id", authMiddleware, roleMiddleware("admin"), updateMenuItem);
router.patch("/:id/availability", authMiddleware, roleMiddleware("admin"), toggleAvailability);

export default router;