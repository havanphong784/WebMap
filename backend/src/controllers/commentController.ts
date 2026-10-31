import {createComment, listComments} from "../services/commentService.js";
import {sendError, sendSuccess} from "../utils/apiResponse.js";
import type {AsyncRequestHandler} from "../types/http.js";

export const getComments: AsyncRequestHandler = async (req, res) => {
  try {
    const data = await listComments(req.params.id);
    sendSuccess(res, {data});
  } catch (err: any) {
    sendError(res, {status: 500, message: err.message});
  }
};

export const postComment: AsyncRequestHandler = async (req, res) => {
  const userId = req.user?.uid;
  if (!userId) {
    return sendError(res, {status: 401, message: "Yêu cầu đăng nhập"});
  }
  const {content} = req.body;

  if (!content || !content.trim()) {
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
  } catch (err: any) {
    if (
      err.message === "Thiếu thông tin comment" ||
      err.message === "Nội dung bình luận không được để trống"
    ) {
      return sendError(res, {status: 400, code: "COMMENT_INVALID", message: err.message});
    }

    sendError(res, {status: 500, message: err.message});
  }
};
