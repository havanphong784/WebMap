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

// Pagination helper
const getPaginationParams = (page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;
  return {pageNum, limitNum, offset};
};

export const listLocations = async ({userId, minLng, maxLng, minLat, maxLat, page = 1, limit = 500}) => {
  // Map view cần load nhiều hơn — cap ở 500 thay vì 100
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(500, Math.max(1, parseInt(limit, 10) || 500));
  const offset = (pageNum - 1) * limitNum;
  
  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM locations l
    WHERE l.lat BETWEEN $1 AND $2
      AND l.lng BETWEEN $3 AND $4
      AND (l.is_public = true OR l.user_id = $5)
  `;
  const countResult = await pool.query(countQuery, [minLat, maxLat, minLng, maxLng, userId || "guest"]);
  const total = parseInt(countResult.rows[0].total, 10);
  
  // Get paginated data
  const query = `
    SELECT ${LOCATION_SELECT_COLUMNS}
    ${LOCATION_FROM_CLAUSE("$5")}
    WHERE l.lat BETWEEN $1 AND $2
      AND l.lng BETWEEN $3 AND $4
      AND (l.is_public = true OR l.user_id = $5)
    ORDER BY l.created_at DESC
    LIMIT $6 OFFSET $7;
  `;
  const values = [minLat, maxLat, minLng, maxLng, userId || "guest", limitNum, offset];
  const result = await pool.query(query, values);
  
  return {
    data: result.rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
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

export const listUserLocations = async ({uid, currentUserId, page = 1, limit = 20}) => {
  const {pageNum, limitNum, offset} = getPaginationParams(page, limit);
  
  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM locations l
    WHERE l.user_id = $1
  `;
  const countResult = await pool.query(countQuery, [uid]);
  const total = parseInt(countResult.rows[0].total, 10);
  
  // Get paginated data
  const query = `
    SELECT ${LOCATION_SELECT_COLUMNS}
    ${LOCATION_FROM_CLAUSE("$2")}
    WHERE l.user_id = $1
    ORDER BY l.created_at DESC
    LIMIT $3 OFFSET $4;
  `;
  const result = await pool.query(query, [uid, currentUserId || "guest", limitNum, offset]);
  
  return {
    data: result.rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

export const listTrendingLocations = async ({userId, page = 1, limit = 20}) => {
  const {pageNum, limitNum, offset} = getPaginationParams(page, limit);
  
  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM locations l
    WHERE l.is_public = true
  `;
  const countResult = await pool.query(countQuery);
  const total = parseInt(countResult.rows[0].total, 10);
  
  // Get paginated data
  const query = `
    SELECT ${LOCATION_SELECT_COLUMNS}
    ${LOCATION_FROM_CLAUSE("$1")}
    WHERE l.is_public = true
    ORDER BY l.likes_count DESC, l.created_at DESC
    LIMIT $2 OFFSET $3;
  `;
  const result = await pool.query(query, [userId || "guest", limitNum, offset]);
  
  return {
    data: result.rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
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

export const listLocationsByTag = async ({tag, userId, page = 1, limit = 20}) => {
  const {pageNum, limitNum, offset} = getPaginationParams(page, limit);
  
  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM locations l
    WHERE $1 = ANY(l.tags)
      AND (l.is_public = true OR l.user_id = $2)
  `;
  const countResult = await pool.query(countQuery, [tag, userId || "guest"]);
  const total = parseInt(countResult.rows[0].total, 10);
  
  // Get paginated data
  const query = `
    SELECT ${LOCATION_SELECT_COLUMNS}
    ${LOCATION_FROM_CLAUSE("$2")}
    WHERE $1 = ANY(l.tags)
      AND (l.is_public = true OR l.user_id = $2)
    ORDER BY l.created_at DESC
    LIMIT $3 OFFSET $4;
  `;
  const result = await pool.query(query, [tag, userId || "guest", limitNum, offset]);
  
  return {
    data: result.rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
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

export const listFollowingLocations = async ({userId, page = 1, limit = 20}) => {
  const {pageNum, limitNum, offset} = getPaginationParams(page, limit);
  
  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM locations l
    JOIN follows f ON l.user_id = f.followed_id
    WHERE f.follower_id = $1 AND l.is_public = true
  `;
  const countResult = await pool.query(countQuery, [userId]);
  const total = parseInt(countResult.rows[0].total, 10);
  
  // Get paginated data
  const query = `
    SELECT ${LOCATION_SELECT_COLUMNS}
    FROM locations l
    JOIN follows f ON l.user_id = f.followed_id
    LEFT JOIN users u ON l.user_id = u.firebase_uid
    LEFT JOIN likes lk_viewer ON lk_viewer.location_id = l.id AND lk_viewer.user_id = $1
    WHERE f.follower_id = $1 AND l.is_public = true
    ORDER BY l.created_at DESC
    LIMIT $2 OFFSET $3;
  `;
  const result = await pool.query(query, [userId, limitNum, offset]);
  
  return {
    data: result.rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};
