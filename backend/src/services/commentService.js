import pool from "../config/db.js";
import { addXP } from "./gamificationService.js";
import { createNotification } from "./notificationService.js";

export const listComments = async (locationId) => {
  const query = `
      SELECT c.*, u.name, u.avatar_url, u.xp, u.level, u.tier
      FROM comments c
               JOIN users u ON c.user_id = u.firebase_uid
      WHERE c.location_id = $1
      ORDER BY c.created_at DESC
  `;
  const result = await pool.query(query, [locationId]);
  return result.rows;
};

export const createComment = async ({locationId, userId, content}) => {
  if (!locationId || !userId) {
    throw new Error("Thiếu thông tin comment");
  }

  const normalizedContent = typeof content === "string" ? content.trim() : "";
  if (!normalizedContent) {
    throw new Error("Nội dung bình luận không được để trống");
  }

  const result = await pool.query(
    "INSERT INTO comments (user_id, location_id, content) VALUES ($1, $2, $3) RETURNING *",
    [userId, locationId, normalizedContent]
  );

  try {
    const locInfo = await pool.query("SELECT user_id FROM locations WHERE id = $1", [locationId]);
    if (locInfo.rows.length > 0) {
      const ownerId = locInfo.rows[0].user_id;
      if (ownerId !== userId) {
        await createNotification({
          recipientId: ownerId,
          senderId: userId,
          type: 'COMMENT',
          message: `đã bình luận: "${normalizedContent.substring(0, 30)}${normalizedContent.length > 30 ? '...' : ''}"`,
          locationId: locationId
        });
      }
    }
  } catch (err) {
    console.error("Lỗi tạo thông báo comment:", err);
  }

  await addXP(userId, "COMMENT");

  return result.rows[0];
};

