import { createComment, listComments } from "../services/commentService.js";

export const getComments = async (req, res) => {
  try {
    const data = await listComments(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const postComment = async (req, res) => {
  const { user_id, content } = req.body;

  try {
    const data = await createComment({
      locationId: req.params.id,
      userId: user_id,
      content
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

