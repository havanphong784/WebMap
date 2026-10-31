import {toggleLike} from "../services/likeService.js";
import {sendError, sendSuccess} from "../utils/apiResponse.js";
import type {AsyncRequestHandler} from "../types/http.js";

export const toggleLocationLike: AsyncRequestHandler = async (req, res) => {
  const userId = req.user?.uid;
  if (!userId) {
    return sendError(res, {status: 401, message: "Yêu cầu đăng nhập"});
  }
  const locationId = req.params.id;

  if (!locationId) {
    return sendError(res, {
      status: 400,
      code: "LIKE_INVALID",
      message: "Thiếu location_id",
    });
  }

  try {
    const result = await toggleLike({userId, locationId});
    sendSuccess(res, {action: result.action});
  } catch (err) {
    console.error("Lỗi API Like:", err);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};
