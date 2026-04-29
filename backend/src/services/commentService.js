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

export const createComment = async ({ locationId, userId, content }) => {
  const result = await pool.query(
    "INSERT INTO comments (user_id, location_id, content) VALUES ($1, $2, $3) RETURNING *",
    [userId, locationId, content]
  );
  return result.rows[0];
};

