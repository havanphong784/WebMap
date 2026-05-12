import {getUserProfile, listActiveUsers, updateLastSeen, upsertUser} from "../services/authService.js";
import {sendError, sendSuccess} from "../utils/apiResponse.js";

export const login = async (req, res) => {
  try {
    const {uid, email, name, picture} = req.user;
    const savedUser = await upsertUser({uid, email, name, picture});
    sendSuccess(res, {message: "Đăng nhập thành công", user: savedUser});
  } catch (error) {
    console.error("Lỗi khi lưu user:", error);
    sendError(res, {status: 500, message: "Lỗi Server nội bộ"});
  }
};

export const getProfile = async (req, res) => {
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

export const getActiveUsers = async (req, res) => {
  try {
    const users = await listActiveUsers(50);
    sendSuccess(res, {data: users});
  } catch (error) {
    console.error("Lỗi khi lấy danh sách user active:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const heartbeat = async (req, res) => {
  try {
    const {uid} = req.user;
    await updateLastSeen(uid, req.body?.location);
    sendSuccess(res);
  } catch (error) {
    console.error("Lỗi heartbeat:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};
