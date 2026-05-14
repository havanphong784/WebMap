import {getNotificationsByUserId, markAllAsRead, markAsRead} from "../services/notificationService.js";
import {sendError, sendSuccess} from "../utils/apiResponse.js";

export const getMyNotifications = async (req, res) => {
  try {
    const requesterId = req.user.uid;
    const targetUid = req.params.uid;
    if (requesterId !== targetUid) {
      return sendError(res, {
        status: 403,
        code: "NOTIFICATION_FORBIDDEN",
        message: "Không thể xem thông báo của người dùng khác",
      });
    }

    const notifications = await getNotificationsByUserId(targetUid);
    sendSuccess(res, {data: notifications});
  } catch (error) {
    console.error("Lỗi lấy thông báo:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const readNotification = async (req, res) => {
  try {
    const {id} = req.params;
    await markAsRead(id, req.user.uid);
    sendSuccess(res);
  } catch (error) {
    console.error("Lỗi đọc thông báo:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const readAllNotifications = async (req, res) => {
  try {
    await markAllAsRead(req.user.uid);
    sendSuccess(res);
  } catch (error) {
    console.error("Lỗi đọc tất cả thông báo:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};
