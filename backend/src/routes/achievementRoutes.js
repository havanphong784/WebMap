import express from "express";
import {
  getAchievements,
  getUnreadCount,
  markSeen,
} from "../controllers/achievementController.js";
import {optionalVerifyToken, verifyToken} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Read achievements của user khác là OK (giống GitHub profile), không yêu cầu auth.
router.get("/:userId", optionalVerifyToken, getAchievements);

// Unread/markSeen chỉ cho chính user đó.
router.get("/unread/:userId", verifyToken, getUnreadCount);
router.post("/mark-seen/:userId", verifyToken, markSeen);

export default router;
