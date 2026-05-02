import { getNotificationsByUserId, markAllAsRead, markAsRead } from "../services/notificationService.js";

export const getMyNotifications = async (req, res) => {
  try {
    const { uid } = req.params; // Hoặc lấy từ req.user nếu dùng middleware verifyToken
    const notifications = await getNotificationsByUserId(uid);
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    console.error("Lỗi lấy thông báo:", error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

export const readNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    await markAsRead(id, user_id);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

export const readAllNotifications = async (req, res) => {
  try {
    const { user_id } = req.body;
    await markAllAsRead(user_id);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};
