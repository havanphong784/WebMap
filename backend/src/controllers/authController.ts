import {getUserProfile, listActiveUsers, updateLastSeen, upsertUser} from "../services/authService.js";
import {sendError, sendSuccess} from "../utils/apiResponse.js";
import type {AsyncRequestHandler} from "../types/http.js";
import type {UserLocationInput} from "../types/database.js";

export const login: AsyncRequestHandler = async (req, res) => {
  try {
    const {uid, email, name, picture} = req.user || {};
    if (!uid) {
      return sendError(res, {status: 401, message: "Yêu cầu đăng nhập"});
    }
    const savedUser = await upsertUser({uid, email, name, picture});
    sendSuccess(res, {message: "Đăng nhập thành công", user: savedUser});
  } catch (error) {
    console.error("Lỗi khi lưu user:", error);
    sendError(res, {status: 500, message: "Lỗi Server nội bộ"});
  }
};

export const getProfile: AsyncRequestHandler = async (req, res) => {
  try {
    const {uid} = req.params;
    const user = await getUserProfile(uid);

    if (!user) {
      return sendError(res, {
        status: 404,
        code: "USER_NOT_FOUND",
        message: "Không tìm thấy người dùng",
      });
    }

    sendSuccess(res, {user});
  } catch (error) {
    console.error("Lỗi khi lấy profile:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const getActiveUsers: AsyncRequestHandler = async (req, res) => {
  try {
    const users = await listActiveUsers(50);
    sendSuccess(res, {data: users});
  } catch (error) {
    console.error("Lỗi khi lấy danh sách user active:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const heartbeat: AsyncRequestHandler = async (req, res) => {
  try {
    const {uid} = req.user || {};
    if (!uid) {
      return sendError(res, {status: 401, message: "Yêu cầu đăng nhập"});
    }
    await updateLastSeen(uid, req.body?.location as UserLocationInput | undefined);
    sendSuccess(res);
  } catch (error) {
    console.error("Lỗi heartbeat:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};
