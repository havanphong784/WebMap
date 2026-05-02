import express from "express";
import { getMyNotifications, readAllNotifications, readNotification } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/user/:uid", getMyNotifications);
router.put("/:id/read", readNotification);
router.put("/read-all", readAllNotifications);

export default router;
