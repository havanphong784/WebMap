import express from "express";
import {
  toggleFollow,
  getFollowers,
  getFollowing,
  getFriends,
  checkFollowStatus
} from "../controllers/followController.js";

const router = express.Router();

router.post("/toggle", toggleFollow);
router.get("/friends/:userId", getFriends);
router.get("/followers/:userId", getFollowers);
router.get("/following/:userId", getFollowing);
router.get("/status", checkFollowStatus);

export default router;
