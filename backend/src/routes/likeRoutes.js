import express from "express";
import { toggleLocationLike } from "../controllers/likeController.js";

const router = express.Router();

router.post("/:id/like", toggleLocationLike);

export default router;
