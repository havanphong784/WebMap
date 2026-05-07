import express from "express";
import {
  toggleFollow,
  getFollowers,
  getFollowing,
  checkFollowStatus
} from "../controllers/followController.js";

const router = express.Router();

router.post("/toggle", toggleFollow);
router.get("/followers/:userId", getFollowers);
router.get("/following/:userId", getFollowing);
router.get("/status", checkFollowStatus);

export default router;
