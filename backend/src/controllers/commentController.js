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
  const userId = req.user.uid;
  const {content} = req.body;

  if (typeof content !== "string" || !content.trim()) {
    return sendError(res, {
      status: 400,
      code: "COMMENT_INVALID",
      message: "Thiếu nội dung bình luận",
    });
  }

  try {
    const data = await createComment({
      locationId: req.params.id,
      userId,
      content: content.trim(),
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
