import express, { type Router } from "express";
import {verifyToken} from "../middlewares/authMiddleware.js";
import {
  createMessage,
  getConversation,
  getThreads,
  readConversation,
} from "../controllers/messageController.js";

const router: Router = express.Router();

router.use(verifyToken);

router.get("/threads", getThreads);
router.get("/:peerId", getConversation);
router.post("/:peerId", createMessage);
router.put("/:peerId/read", readConversation);

export default router;
