import express from "express";
import * as aiController from "../controllers/aiController.js";

const router = express.Router();

router.post("/suggest-tags", aiController.suggestTags);
router.post("/summary", aiController.getSmartSummary);
router.post("/analyze-review", aiController.analyzeReview);

export default router;
