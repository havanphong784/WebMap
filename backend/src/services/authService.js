import pool from "../config/db.js";

export const upsertUser = async ({ uid, email, name, picture }) => {
  const query = `
    INSERT INTO users (firebase_uid, email, name, avatar_url)
    VALUES ($1, $2, $3, $4) ON CONFLICT (firebase_uid)
    DO
      UPDATE SET
        name = EXCLUDED.name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW()
      RETURNING *;
  `;
  const values = [uid, email, name, picture];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const getUserProfile = async (uid) => {
  const query = `
    SELECT u.*,
           (SELECT COUNT(*) FROM locations WHERE user_id = u.firebase_uid) AS total_posts,
           (SELECT COUNT(*)
            FROM likes
            WHERE location_id IN (SELECT id FROM locations WHERE user_id = u.firebase_uid)) AS total_likes_received
    FROM users u
    WHERE u.firebase_uid = $1;
  `;
  const result = await pool.query(query, [uid]);
  return result.rows[0];
};
export const listActiveUsers = async (limit = 10) => {
  const query = `
    SELECT firebase_uid, name, avatar_url, last_seen_at, level, tier
    FROM users
    WHERE last_seen_at > NOW() - INTERVAL '5 minutes'
    ORDER BY last_seen_at DESC
    LIMIT $1;
  `;
  const result = await pool.query(query, [limit]);
  return result.rows;
};

export const updateLastSeen = async (uid) => {
  const query = `
    UPDATE users 
    SET last_seen_at = NOW() 
    WHERE firebase_uid = $1;
  `;
  await pool.query(query, [uid]);
};
