import express from "express";
import {
  getMyNotifications,
  readAllNotifications,
  readNotification,
} from "../controllers/notificationController.js";
import {verifyToken} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyToken);

router.get("/user/:uid", getMyNotifications);
router.put("/read-all", readAllNotifications);
router.put("/:id/read", readNotification);

export default router;
