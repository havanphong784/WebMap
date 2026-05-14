import express from "express";
import {
  toggleFollow,
  getFollowers,
  getFollowing,
  getFriends,
  checkFollowStatus,
} from "../controllers/followController.js";
import {verifyToken} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/toggle", toggleFollow);
router.get("/status", checkFollowStatus);
router.get("/friends/:userId", getFriends);
router.get("/followers/:userId", getFollowers);
router.get("/following/:userId", getFollowing);

export default router;
