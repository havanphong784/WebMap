import pool from "../config/db.js";
import {addXP} from "./gamificationService.js";

export const toggleLike = async ({userId, locationId}) => {
  const check = await pool.query(
    "SELECT * FROM likes WHERE user_id = $1 AND location_id = $2",
    [userId, locationId]
  );

  if (check.rows.length > 0) {
    await pool.query(
      "DELETE FROM likes WHERE user_id = $1 AND location_id = $2",
      [userId, locationId]
    );

    handleLikeXP(locationId, userId, "UNLIKE_RECEIVED");

    return {action: "unliked"};
  }

  await pool.query(
    "INSERT INTO likes (user_id, location_id) VALUES ($1, $2)",
    [userId, locationId]
  );

  handleLikeXP(locationId, userId, "LIKE_RECEIVED");

  return {action: "liked"};
};

async function handleLikeXP(locationId, userId, type) {
  try {
    const locInfo = await pool.query("SELECT user_id FROM locations WHERE id = $1", [locationId]);
    if (locInfo.rows.length > 0) {
      const ownerId = locInfo.rows[0].user_id;
      if (ownerId !== userId) {
        await addXP(ownerId, type);

        if (type === "LIKE_RECEIVED") {
          const {createNotification} = await import("./notificationService.js");
          await createNotification({
            recipientId: ownerId,
            senderId: userId,
            type: 'like',
            message: 'đã thích địa điểm của bạn',
            locationId: locationId
          });
        }
      }
    }
  } catch (err) {
    console.error(`Lỗi xử lý Gamification cho ${type}:`, err);
  }
}

