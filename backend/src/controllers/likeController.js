import {toggleLike} from "../services/likeService.js";
import {sendError, sendSuccess} from "../utils/apiResponse.js";

export const toggleLocationLike = async (req, res) => {
  const {user_id} = req.body;
  const location_id = req.params.id;

  if (!user_id || !location_id) {
    return sendError(res, {
      status: 400,
      code: "LIKE_INVALID",
      message: "Thiếu user_id hoặc location_id",
    });
  }

  try {
    const result = await toggleLike({userId: user_id, locationId: location_id});
    sendSuccess(res, {action: result.action});
  } catch (err) {
    console.error("Lỗi API Like:", err);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};
