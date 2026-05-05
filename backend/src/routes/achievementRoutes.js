import express from "express";
import { getAchievements, getUnreadCount, markSeen } from "../controllers/achievementController.js";

const router = express.Router();

router.get("/:userId", getAchievements);
router.get("/unread/:userId", getUnreadCount);
router.post("/mark-seen/:userId", markSeen);

export default router;
