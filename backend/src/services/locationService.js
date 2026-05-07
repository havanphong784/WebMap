import pool from "../config/db.js";

export const listLocations = async ({ userId, minLng, maxLng, minLat, maxLat }) => {
  const query = `
    SELECT l.*,
           u.name AS user_name,
           u.avatar_url AS user_avatar,
           u.xp AS user_xp,
           u.level AS user_level,
           u.tier AS user_tier,
           COALESCE(lc.likes_count, 0) AS likes_count,
           COALESCE(cc.comments_count, 0) AS comments_count,
           EXISTS (SELECT 1 FROM likes WHERE location_id = l.id AND user_id = $5) AS is_liked
    FROM locations l
    LEFT JOIN users u ON l.user_id = u.firebase_uid
    LEFT JOIN (
      SELECT location_id, COUNT(*) as likes_count
      FROM likes
      GROUP BY location_id
    ) lc ON lc.location_id = l.id
    LEFT JOIN (
      SELECT location_id, COUNT(*) as comments_count
      FROM comments
      GROUP BY location_id
    ) cc ON cc.location_id = l.id
    WHERE (l.lat BETWEEN $1 AND $2)
      AND (l.lng BETWEEN $3 AND $4)
      AND (l.is_public = true OR l.user_id = $5)
    ORDER BY l.created_at DESC LIMIT 500;
  `;
  const values = [minLat, maxLat, minLng, maxLng, userId || "guest"];
  const result = await pool.query(query, values);
  return result.rows;
};

export const createLocation = async ({
  user_id,
  name,
  address,
  category,
  review_text,
  rating,
  lat,
  lng,
  image_url,
  is_public,
  tags
}) => {
  const query = `
    INSERT INTO locations
    (user_id, name, address, category, review_text, rating, lat, lng, image_url, is_public, tags)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *;
  `;

  const values = [
    user_id,
    name,
    address,
    category || "other",
    review_text || "",
    rating || 5,
    lat,
    lng,
    image_url || null,
    is_public !== undefined ? is_public : true,
    tags && tags.length > 0 ? tags : []
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const listUserLocations = async ({ uid, currentUserId }) => {
  const query = `
    SELECT l.*,
           u.name AS user_name,
           u.avatar_url AS user_avatar,
           u.xp AS user_xp,
           u.level AS user_level,
           u.tier AS user_tier,
           COALESCE(lc.likes_count, 0) AS likes_count,
           COALESCE(cc.comments_count, 0) AS comments_count,
           EXISTS (SELECT 1 FROM likes WHERE location_id = l.id AND user_id = $2) AS is_liked
    FROM locations l
    LEFT JOIN users u ON l.user_id = u.firebase_uid
    LEFT JOIN (
      SELECT location_id, COUNT(*) as likes_count
      FROM likes
      GROUP BY location_id
    ) lc ON lc.location_id = l.id
    LEFT JOIN (
      SELECT location_id, COUNT(*) as comments_count
      FROM comments
      GROUP BY location_id
    ) cc ON cc.location_id = l.id
    WHERE l.user_id = $1
    ORDER BY l.created_at DESC;
  `;

  const result = await pool.query(query, [uid, currentUserId || "guest"]);
  return result.rows;
};

export const listTrendingLocations = async ({ userId }) => {
  const query = `
    SELECT l.*,
           u.name AS user_name,
           u.avatar_url AS user_avatar,
           u.xp AS user_xp,
           u.level AS user_level,
           u.tier AS user_tier,
           COALESCE(lc.likes_count, 0) AS likes_count,
           COALESCE(cc.comments_count, 0) AS comments_count,
           EXISTS (SELECT 1 FROM likes WHERE location_id = l.id AND user_id = $1) AS is_liked
    FROM locations l
    LEFT JOIN users u ON l.user_id = u.firebase_uid
    LEFT JOIN (
      SELECT location_id, COUNT(*) as likes_count
      FROM likes
      GROUP BY location_id
    ) lc ON lc.location_id = l.id
    LEFT JOIN (
      SELECT location_id, COUNT(*) as comments_count
      FROM comments
      GROUP BY location_id
    ) cc ON cc.location_id = l.id
    WHERE l.is_public = true
    ORDER BY likes_count DESC, l.created_at DESC LIMIT 20;
  `;
  const result = await pool.query(query, [userId || "guest"]);
  return result.rows;
};

export const deleteLocation = async ({ locationId, userId }) => {
  const result = await pool.query(
    "DELETE FROM locations WHERE id = $1 AND user_id = $2 RETURNING *",
    [locationId, userId]
  );
  if (result.rows.length === 0) {
    throw new Error("Không tìm thấy địa điểm hoặc bạn không có quyền xóa");
  }
  return result.rows[0];
};

export const getLocationDetail = async ({ locationId, userId }) => {
  const query = `
    SELECT l.*,
           u.name AS user_name,
           u.avatar_url AS user_avatar,
           u.xp AS user_xp,
           u.level AS user_level,
           u.tier AS user_tier,
           COALESCE(lc.likes_count, 0) AS likes_count,
           COALESCE(cc.comments_count, 0) AS comments_count,
           EXISTS (SELECT 1 FROM likes WHERE location_id = l.id AND user_id = $2) AS is_liked
    FROM locations l
    LEFT JOIN users u ON l.user_id = u.firebase_uid
    LEFT JOIN (
      SELECT location_id, COUNT(*) as likes_count
      FROM likes
      GROUP BY location_id
    ) lc ON lc.location_id = l.id
    LEFT JOIN (
      SELECT location_id, COUNT(*) as comments_count
      FROM comments
      GROUP BY location_id
    ) cc ON cc.location_id = l.id
    WHERE l.id = $1;
  `;
  const result = await pool.query(query, [locationId, userId || "guest"]);
  return result.rows[0];
};

export const listLocationsByTag = async ({ tag, userId }) => {
  const query = `
    SELECT l.*,
           u.name AS user_name,
           u.avatar_url AS user_avatar,
           u.xp AS user_xp,
           u.level AS user_level,
           u.tier AS user_tier,
           COALESCE(lc.likes_count, 0) AS likes_count,
           COALESCE(cc.comments_count, 0) AS comments_count,
           EXISTS (SELECT 1 FROM likes WHERE location_id = l.id AND user_id = $2) AS is_liked
    FROM locations l
    LEFT JOIN users u ON l.user_id = u.firebase_uid
    LEFT JOIN (
      SELECT location_id, COUNT(*) as likes_count
      FROM likes
      GROUP BY location_id
    ) lc ON lc.location_id = l.id
    LEFT JOIN (
      SELECT location_id, COUNT(*) as comments_count
      FROM comments
      GROUP BY location_id
    ) cc ON cc.location_id = l.id
    WHERE $1 = ANY(l.tags)
      AND (l.is_public = true OR l.user_id = $2)
    ORDER BY l.created_at DESC LIMIT 100;
  `;
  const result = await pool.query(query, [tag, userId || "guest"]);
  return result.rows;
};

export const listUniqueTags = async () => {
  const query = `
    SELECT DISTINCT unnest(tags) as tag 
    FROM locations 
    WHERE is_public = true 
    ORDER BY tag ASC;
  `;
  const result = await pool.query(query);
  return result.rows.map(r => r.tag);
};

export const listFollowingLocations = async ({ userId }) => {
  const query = `
    SELECT l.*,
           u.name AS user_name,
           u.avatar_url AS user_avatar,
           u.xp AS user_xp,
           u.level AS user_level,
           u.tier AS user_tier,
           COALESCE(lc.likes_count, 0) AS likes_count,
           COALESCE(cc.comments_count, 0) AS comments_count,
           EXISTS (SELECT 1 FROM likes WHERE location_id = l.id AND user_id = $1) AS is_liked
    FROM locations l
    JOIN follows f ON l.user_id = f.followed_id
    LEFT JOIN users u ON l.user_id = u.firebase_uid
    LEFT JOIN (
      SELECT location_id, COUNT(*) as likes_count
      FROM likes
      GROUP BY location_id
    ) lc ON lc.location_id = l.id
    LEFT JOIN (
      SELECT location_id, COUNT(*) as comments_count
      FROM comments
      GROUP BY location_id
    ) cc ON cc.location_id = l.id
    WHERE f.follower_id = $1 AND l.is_public = true
    ORDER BY l.created_at DESC LIMIT 50;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};
