import express from "express";
import * as chatbotController from "../controllers/chatbotController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/chat", chatbotController.chat);
router.get("/sessions", chatbotController.sessions);
router.get("/sessions/:sessionId/messages", chatbotController.messages);
router.post("/feedback", chatbotController.feedback);

export default router;
