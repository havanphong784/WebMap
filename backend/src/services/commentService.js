import pool from "../config/db.js";

export const listComments = async (locationId) => {
  const query = `
      SELECT c.*, u.name, u.avatar_url
      FROM comments c
               JOIN users u ON c.user_id = u.firebase_uid
      WHERE c.location_id = $1
      ORDER BY c.created_at DESC
  `;
  const result = await pool.query(query, [locationId]);
  return result.rows;
};

export const createComment = async ({locationId, userId, content}) => {
  const result = await pool.query(
    "INSERT INTO comments (user_id, location_id, content) VALUES ($1, $2, $3) RETURNING *",
    [userId, locationId, content]
  );

  try {
    const locInfo = await pool.query("SELECT user_id FROM locations WHERE id = $1", [locationId]);
    if (locInfo.rows.length > 0) {
      const ownerId = locInfo.rows[0].user_id;
      if (ownerId !== userId) {
        const {createNotification} = await import("./notificationService.js");
        await createNotification({
          recipientId: ownerId,
          senderId: userId,
          type: 'comment',
          message: `đã bình luận: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
          locationId: locationId
        });
      }
    }
  } catch (err) {
    console.error("Lỗi tạo thông báo comment:", err);
  }

  return result.rows[0];
};

