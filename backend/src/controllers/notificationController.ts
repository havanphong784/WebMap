import {getNotificationsByUserId, markAllAsRead, markAsRead} from "../services/notificationService.js";
import {sendError, sendSuccess} from "../utils/apiResponse.js";
import type {AsyncRequestHandler} from "../types/http.js";

export const getMyNotifications: AsyncRequestHandler = async (req, res) => {
  try {
    const requesterId = req.user?.uid;
    const targetUid = req.params.uid;
    if (!requesterId || requesterId !== targetUid) {
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

export const readNotification: AsyncRequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return sendError(res, {status: 401, message: "Yêu cầu đăng nhập"});
    }
    const {id} = req.params;
    await markAsRead(id, userId);
    sendSuccess(res);
  } catch (error) {
    console.error("Lỗi đọc thông báo:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const readAllNotifications: AsyncRequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return sendError(res, {status: 401, message: "Yêu cầu đăng nhập"});
    }
    await markAllAsRead(userId);
    sendSuccess(res);
  } catch (error) {
    console.error("Lỗi đọc tất cả thông báo:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};
