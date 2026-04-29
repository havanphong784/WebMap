import express from "express";
import { verifyToken } from "../middlewares/authMiddleware.js";
import { getProfile, login } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", verifyToken, login);
router.get("/:uid", getProfile);

export default router;


