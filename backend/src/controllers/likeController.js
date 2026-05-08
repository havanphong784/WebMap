import { toggleLike } from "../services/likeService.js";

export const toggleLocationLike = async (req, res) => {
  const { user_id } = req.body;
  const location_id = req.params.id;

  if (!user_id || !location_id) {
    return res.status(400).json({ success: false, message: "Thiếu user_id hoặc location_id" });
  }

  try {
    const result = await toggleLike({ userId: user_id, locationId: location_id });
    res.json({ success: true, action: result.action });
  } catch (err) {
    console.error("Lỗi API Like:", err);
    res.status(500).json({ error: "Lỗi Server" });
  }
};

