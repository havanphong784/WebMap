import express from "express";
import { getComments, postComment } from "../controllers/commentController.js";

const router = express.Router();

router.get("/:id/comments", getComments);
router.post("/:id/comments", postComment);

export default router;
