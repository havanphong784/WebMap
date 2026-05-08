import {createComment, listComments} from "../services/commentService.js";

export const getComments = async (req, res) => {
  try {
    const data = await listComments(req.params.id);
    res.json({success: true, data});
  } catch (err) {
    res.status(500).json({error: err.message});
  }
};

export const postComment = async (req, res) => {
  const {user_id, content} = req.body;

  if (!user_id || typeof content !== "string" || !content.trim()) {
    return res.status(400).json({success: false, message: "Thiếu user_id hoặc nội dung bình luận"});
  }

  try {
    const data = await createComment({
      locationId: req.params.id,
      userId: user_id,
      content: content.trim()
    });

    res.json({success: true, data});
  } catch (err) {
    if (
      err?.message === "Thiếu thông tin comment" ||
      err?.message === "Nội dung bình luận không được để trống"
    ) {
      return res.status(400).json({success: false, message: err.message});
    }

    res.status(500).json({error: err.message});
  }
};

