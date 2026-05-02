import pool from "../config/db.js";

export const getNotificationsByUserId = async (userId) => {
  const query = `
      SELECT n.*, u.name as sender_name, u.avatar_url as sender_avatar, l.name as location_name, l.lat, l.lng
      FROM notifications n
               LEFT JOIN users u ON n.sender_id = u.firebase_uid
               LEFT JOIN locations l ON n.location_id = l.id
      WHERE n.recipient_id = $1
      ORDER BY n.created_at DESC LIMIT 50;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};

export const createNotification = async ({recipientId, senderId, type, message, locationId}) => {
  if (recipientId === senderId) return null;

  const query = `
      INSERT INTO notifications (recipient_id, sender_id, type, message, location_id)
      VALUES ($1, $2, $3, $4, $5) RETURNING *;
  `;
  const result = await pool.query(query, [recipientId, senderId, type, message, locationId]);
  return result.rows[0];
};

export const markAsRead = async (notificationId, userId) => {
  const query = `
      UPDATE notifications
      SET is_read = true
      WHERE id = $1
        AND recipient_id = $2 RETURNING *;
  `;
  const result = await pool.query(query, [notificationId, userId]);
  return result.rows[0];
};

export const markAllAsRead = async (userId) => {
  const query = `
      UPDATE notifications
      SET is_read = true
      WHERE recipient_id = $1;
  `;
  await pool.query(query, [userId]);
};
