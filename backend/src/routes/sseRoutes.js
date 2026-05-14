import express from "express";
import {verifyToken} from "../middlewares/authMiddleware.js";
import {addConnection, removeConnection, sendToUser} from "../services/sseService.js";
import {getNotificationsByUserId} from "../services/notificationService.js";
import {listActiveUsers} from "../services/authService.js";

const router = express.Router();

/**
 * SSE stream endpoint.
 * Client kết nối 1 lần, server push events khi có thay đổi.
 * Events: notification, active_users, heartbeat_ack
 */
router.get("/stream", verifyToken, async (req, res) => {
  const userId = req.user.uid;

  // SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no", // Nginx proxy buffering off
  });

  // Gửi comment để giữ connection alive
  res.write(":ok\n\n");

  // Đăng ký connection
  addConnection(userId, res);

  // Gửi initial data ngay khi connect
  try {
    const [notifications, activeUsers] = await Promise.all([
      getNotificationsByUserId(userId),
      listActiveUsers(50),
    ]);

    sendToUser(userId, "notifications", notifications);
    sendToUser(userId, "active_users", activeUsers);
  } catch (err) {
    console.error("SSE initial data error:", err.message);
  }

  // Heartbeat mỗi 30s để giữ connection (tránh proxy timeout)
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(":heartbeat\n\n");
    } catch {
      clearInterval(heartbeatInterval);
    }
  }, 30000);

  // Cleanup khi client disconnect
  req.on("close", () => {
    clearInterval(heartbeatInterval);
    removeConnection(userId, res);
  });
});

export default router;
