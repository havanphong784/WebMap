import {createComment, listComments} from "../services/commentService.js";
import {sendError, sendSuccess} from "../utils/apiResponse.js";

export const getComments = async (req, res) => {
  try {
    const data = await listComments(req.params.id);
    sendSuccess(res, {data});
  } catch (err) {
    sendError(res, {status: 500, message: err.message || "Lỗi Server"});
  }
};

export const postComment = async (req, res) => {
  const {user_id, content} = req.body;

  if (!user_id || typeof content !== "string" || !content.trim()) {
    return sendError(res, {
      status: 400,
      code: "COMMENT_INVALID",
      message: "Thiếu user_id hoặc nội dung bình luận",
    });
  }

  try {
    const data = await createComment({
      locationId: req.params.id,
      userId: user_id,
      content: content.trim()
    });

    sendSuccess(res, {data});
  } catch (err) {
    if (
      err?.message === "Thiếu thông tin comment" ||
      err?.message === "Nội dung bình luận không được để trống"
    ) {
      return sendError(res, {status: 400, code: "COMMENT_INVALID", message: err.message});
    }

    sendError(res, {status: 500, message: err.message || "Lỗi Server"});
  }
};
