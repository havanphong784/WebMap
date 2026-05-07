import pool from "../config/db.js";

export const toggleFollow = async (followerId, followedId) => {
  if (followerId === followedId) throw new Error("Cannot follow yourself");

  const checkQuery = `SELECT * FROM follows WHERE follower_id = $1 AND followed_id = $2`;
  const { rows } = await pool.query(checkQuery, [followerId, followedId]);

  if (rows.length > 0) {
    await pool.query(`DELETE FROM follows WHERE follower_id = $1 AND followed_id = $2`, [followerId, followedId]);
    return { followed: false };
  } else {
    await pool.query(`INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2)`, [followerId, followedId]);
    return { followed: true };
  }
};

export const getFollowers = async (userId) => {
  const query = `
    SELECT u.firebase_uid, u.name, u.avatar_url, u.xp, u.level, u.tier
    FROM follows f
    JOIN users u ON f.follower_id = u.firebase_uid
    WHERE f.followed_id = $1
    ORDER BY f.created_at DESC;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
};

export const getFollowing = async (userId) => {
  const query = `
    SELECT u.firebase_uid, u.name, u.avatar_url, u.xp, u.level, u.tier
    FROM follows f
    JOIN users u ON f.followed_id = u.firebase_uid
    WHERE f.follower_id = $1
    ORDER BY f.created_at DESC;
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows;
};

export const checkIsFollowing = async (followerId, followedId) => {
  if (!followerId || !followedId) return false;
  const query = `SELECT 1 FROM follows WHERE follower_id = $1 AND followed_id = $2`;
  const { rows } = await pool.query(query, [followerId, followedId]);
  return rows.length > 0;
};
