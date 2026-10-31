import express, { type Router } from "express";
import {getComments, postComment} from "../controllers/commentController.js";
import {verifyToken} from "../middlewares/authMiddleware.js";

const router: Router = express.Router();

router.get("/:id/comments", getComments);
router.post("/:id/comments", verifyToken, postComment);

export default router;
