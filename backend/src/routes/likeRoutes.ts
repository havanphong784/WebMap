import express, { type Router } from "express";
import {toggleLocationLike} from "../controllers/likeController.js";
import {verifyToken} from "../middlewares/authMiddleware.js";

const router: Router = express.Router();

router.post("/:id/like", verifyToken, toggleLocationLike);

export default router;
