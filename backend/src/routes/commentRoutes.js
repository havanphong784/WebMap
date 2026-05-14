import express from "express";
import {getComments, postComment} from "../controllers/commentController.js";
import {verifyToken} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/:id/comments", getComments);
router.post("/:id/comments", verifyToken, postComment);

export default router;
