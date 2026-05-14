import pool from "../config/db.js";

// Cột chung cho mọi location query — tránh lặp code và đảm bảo schema nhất quán.
const LOCATION_SELECT_COLUMNS = `
  l.*,
  u.name AS user_name,
  u.avatar_url AS user_avatar,
  u.xp AS user_xp,
  u.level AS user_level,
  u.tier AS user_tier,
  (lk_viewer.id IS NOT NULL) AS is_liked
`;

// JOIN một lần duy nhất với likes của viewer thay vì EXISTS subquery cho mỗi row.
const LOCATION_FROM_CLAUSE = (viewerParam) => `
  FROM locations l
  LEFT JOIN users u ON l.user_id = u.firebase_uid
  LEFT JOIN likes lk_viewer ON lk_viewer.location_id = l.id AND lk_viewer.user_id = ${viewerParam}
`;

export const listLocations = async ({userId, minLng, maxLng, minLat, maxLat}) => {
  const query = `
    SELECT ${LOCATION_SELECT_COLUMNS}
    ${LOCATION_FROM_CLAUSE("$5")}
    WHERE l.lat BETWEEN $1 AND $2
      AND l.lng BETWEEN $3 AND $4
      AND (l.is_public = true OR l.user_id = $5)
    ORDER BY l.created_at DESC
    LIMIT 500;
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
  tags,
}) => {
  const query = `
    INSERT INTO locations
    (user_id, name, address, category, review_text, rating, lat, lng, image_url, is_public, tags)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *;
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
    tags && tags.length > 0 ? tags : [],
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
};

export const listUserLocations = async ({uid, currentUserId}) => {
  const query = `
    SELECT ${LOCATION_SELECT_COLUMNS}
    ${LOCATION_FROM_CLAUSE("$2")}
    WHERE l.user_id = $1
    ORDER BY l.created_at DESC;
  `;
  const result = await pool.query(query, [uid, currentUserId || "guest"]);
  return result.rows;
};

export const listTrendingLocations = async ({userId}) => {
  const query = `
    SELECT ${LOCATION_SELECT_COLUMNS}
    ${LOCATION_FROM_CLAUSE("$1")}
    WHERE l.is_public = true
    ORDER BY l.likes_count DESC, l.created_at DESC
    LIMIT 20;
  `;
  const result = await pool.query(query, [userId || "guest"]);
  return result.rows;
};

export const deleteLocation = async ({locationId, userId}) => {
  const result = await pool.query(
    "DELETE FROM locations WHERE id = $1 AND user_id = $2 RETURNING *",
    [locationId, userId]
  );
  if (result.rows.length === 0) {
    throw new Error("Không tìm thấy địa điểm hoặc bạn không có quyền xóa");
  }
  return result.rows[0];
};

export const getLocationDetail = async ({locationId, userId}) => {
  const query = `
    SELECT ${LOCATION_SELECT_COLUMNS}
    ${LOCATION_FROM_CLAUSE("$2")}
    WHERE l.id = $1;
  `;
  const result = await pool.query(query, [locationId, userId || "guest"]);
  return result.rows[0];
};

export const listLocationsByTag = async ({tag, userId}) => {
  const query = `
    SELECT ${LOCATION_SELECT_COLUMNS}
    ${LOCATION_FROM_CLAUSE("$2")}
    WHERE $1 = ANY(l.tags)
      AND (l.is_public = true OR l.user_id = $2)
    ORDER BY l.created_at DESC
    LIMIT 100;
  `;
  const result = await pool.query(query, [tag, userId || "guest"]);
  return result.rows;
};

export const listUniqueTags = async () => {
  const query = `
    SELECT DISTINCT unnest(tags) AS tag
    FROM locations
    WHERE is_public = true
    ORDER BY tag ASC;
  `;
  const result = await pool.query(query);
  return result.rows.map(r => r.tag);
};

export const listFollowingLocations = async ({userId}) => {
  const query = `
    SELECT ${LOCATION_SELECT_COLUMNS}
    FROM locations l
    JOIN follows f ON l.user_id = f.followed_id
    LEFT JOIN users u ON l.user_id = u.firebase_uid
    LEFT JOIN likes lk_viewer ON lk_viewer.location_id = l.id AND lk_viewer.user_id = $1
    WHERE f.follower_id = $1 AND l.is_public = true
    ORDER BY l.created_at DESC
    LIMIT 50;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
};
