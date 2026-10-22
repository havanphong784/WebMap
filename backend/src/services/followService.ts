import pool from "../config/db.js";
import type {
  FollowRecord,
  FollowUser,
  FriendUser,
  ToggleFollowResult,
} from "../types/database.js";

export type { FollowRecord, FollowUser, FriendUser, ToggleFollowResult };

export const toggleFollow = async (followerId: string, followedId: string): Promise<ToggleFollowResult> => {
  if (followerId === followedId) throw new Error("Cannot follow yourself");

  const checkQuery = `SELECT * FROM follows WHERE follower_id = $1 AND followed_id = $2`;
  const { rows } = await pool.query<FollowRecord>(checkQuery, [followerId, followedId]);

  if (rows.length > 0) {
    await pool.query(`DELETE FROM follows WHERE follower_id = $1 AND followed_id = $2`, [followerId, followedId]);
    return { followed: false };
  } else {
    await pool.query(`INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2)`, [followerId, followedId]);
    return { followed: true };
  }
};

export const getFollowers = async (userId: string): Promise<FollowUser[]> => {
  const query = `
    SELECT u.firebase_uid, u.name, u.avatar_url, u.xp, u.level, u.tier
    FROM follows f
    JOIN users u ON f.follower_id = u.firebase_uid
    WHERE f.followed_id = $1
    ORDER BY f.created_at DESC;
  `;
  const { rows } = await pool.query<FollowUser>(query, [userId]);
  return rows;
};

export const getFollowing = async (userId: string): Promise<FollowUser[]> => {
  const query = `
    SELECT u.firebase_uid, u.name, u.avatar_url, u.xp, u.level, u.tier
    FROM follows f
    JOIN users u ON f.followed_id = u.firebase_uid
    WHERE f.follower_id = $1
    ORDER BY f.created_at DESC;
  `;
  const { rows } = await pool.query<FollowUser>(query, [userId]);
  return rows;
};

export const getFriends = async (userId: string): Promise<FriendUser[]> => {
  const query = `
    SELECT
      u.firebase_uid,
      u.name,
      u.email,
      u.avatar_url,
      u.xp,
      u.level,
      u.tier,
      u.last_seen_at,
      u.current_lat,
      u.current_lng,
      GREATEST(f.created_at, reciprocal.created_at) AS friends_since
    FROM follows f
    JOIN follows reciprocal
      ON reciprocal.follower_id = f.followed_id
     AND reciprocal.followed_id = f.follower_id
    JOIN users u ON u.firebase_uid = f.followed_id
    WHERE f.follower_id = $1
    ORDER BY friends_since DESC;
  `;
  const { rows } = await pool.query<FriendUser>(query, [userId]);
  return rows;
};

export const checkIsFollowing = async (followerId?: string | null, followedId?: string | null): Promise<boolean> => {
  if (!followerId || !followedId) return false;
  const query = `SELECT 1 FROM follows WHERE follower_id = $1 AND followed_id = $2`;
  const { rows } = await pool.query(query, [followerId, followedId]);
  return rows.length > 0;
};
