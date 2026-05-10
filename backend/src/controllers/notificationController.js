import {getNotificationsByUserId, markAllAsRead, markAsRead} from "../services/notificationService.js";
import {sendError, sendSuccess} from "../utils/apiResponse.js";

export const getMyNotifications = async (req, res) => {
  try {
    const {uid} = req.params;
    const notifications = await getNotificationsByUserId(uid);
    sendSuccess(res, {data: notifications});
  } catch (error) {
    console.error("Lỗi lấy thông báo:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const readNotification = async (req, res) => {
  try {
    const {id} = req.params;
    const {user_id} = req.body;
    await markAsRead(id, user_id);
    sendSuccess(res);
  } catch (error) {
    console.error("Lỗi đọc thông báo:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const readAllNotifications = async (req, res) => {
  try {
    const {user_id} = req.body;
    await markAllAsRead(user_id);
    sendSuccess(res);
  } catch (error) {
    console.error("Lỗi đọc tất cả thông báo:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};
