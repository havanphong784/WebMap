import pool from "../config/db.js";

export const listLocations = async ({ userId, minLng, maxLng, minLat, maxLat }) => {
  const query = `
    SELECT l.*,
           (SELECT COUNT(*) FROM likes WHERE location_id = l.id) AS likes_count,
           (SELECT COUNT(*) FROM comments WHERE location_id = l.id) AS comments_count,
           EXISTS (SELECT 1 FROM likes WHERE location_id = l.id AND user_id = $5) AS is_liked
    FROM locations l
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
  is_public
}) => {
  const query = `
    INSERT INTO locations
    (user_id, name, address, category, review_text, rating, lat, lng, image_url, is_public)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *;
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
    is_public !== undefined ? is_public : true
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

export const listUserLocations = async ({ uid, currentUserId }) => {
  const query = `
    SELECT l.*,
           (SELECT COUNT(*) FROM likes WHERE location_id = l.id) AS likes_count,
           (SELECT COUNT(*) FROM comments WHERE location_id = l.id) AS comments_count,
           EXISTS (SELECT 1 FROM likes WHERE location_id = l.id AND user_id = $2) AS is_liked
    FROM locations l
    WHERE l.user_id = $1
    ORDER BY l.created_at DESC;
  `;

  const result = await pool.query(query, [uid, currentUserId || "guest"]);
  return result.rows;
};

export const listTrendingLocations = async ({ userId }) => {
  const query = `
    SELECT l.*,
           (SELECT COUNT(*) FROM likes WHERE location_id = l.id) AS likes_count,
           (SELECT COUNT(*) FROM comments WHERE location_id = l.id) AS comments_count,
           EXISTS (SELECT 1 FROM likes WHERE location_id = l.id AND user_id = $1) AS is_liked
    FROM locations l
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
