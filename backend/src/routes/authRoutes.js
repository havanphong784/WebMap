import express from "express";
import {verifyToken, optionalVerifyToken} from "../middlewares/authMiddleware.js";
import {
  getProfile,
  login,
  getActiveUsers,
  heartbeat,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/login", verifyToken, login);
router.post("/heartbeat", verifyToken, heartbeat);
router.get("/active", optionalVerifyToken, getActiveUsers);
router.get("/:uid", getProfile);

export default router;
