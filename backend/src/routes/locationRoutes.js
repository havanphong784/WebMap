import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const {user_id, minLng, maxLng, minLat, maxLat} = req.query;
    const query = `
        SELECT l.*,
               (SELECT COUNT(*) FROM likes WHERE location_id = l.id)                  AS likes_count,
               EXISTS (SELECT 1 FROM likes WHERE location_id = l.id AND user_id = $5) AS is_liked
        FROM locations l
        WHERE (l.lat BETWEEN $1 AND $2)
          AND (l.lng BETWEEN $3 AND $4)
          AND (l.is_public = true OR l.user_id = $5)
        ORDER BY l.created_at DESC LIMIT 500;
    `;
    const values = [minLat, maxLat, minLng, maxLng, user_id || 'guest'];
    const result = await pool.query(query, values);
    res.status(200).json({success: true, data: result.rows});
  } catch (error) {
    console.error("Lỗi lấy danh sách địa điểm:", error);
    res.status(500).json({success: false, message: 'Lỗi Server'});
  }
});


router.post('/', async (req, res) => {
  try {
    const {
      user_id, name, address, category, review_text, rating, lat, lng, image_url, is_public
    } = req.body;

    const query = `
        INSERT INTO locations
        (user_id, name, address, category, review_text, rating, lat, lng, image_url, is_public)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *;
    `;

    const values = [
      user_id,
      name,
      address,
      category || 'other',
      review_text || '',
      rating || 5,
      lat,
      lng,
      image_url || null,
      is_public !== undefined ? is_public : true
    ];

    const result = await pool.query(query, values);
    res.status(201).json({success: true, data: result.rows[0]});
  } catch (error) {
    console.error("Lỗi khi lưu địa điểm:", error);
    res.status(500).json({success: false, message: 'Lỗi Server'});
  }
});

export default router;
