import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/:user_id', async (req, res) => {
  try {
    const {user_id} = req.params;
    const query = 'SELECT * FROM locations WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [user_id]);

    res.status(200).json({success: true, data: result.rows});
  } catch (error) {
    console.error("Lỗi lấy danh sách địa điểm:", error);
    res.status(500).json({success: false, message: 'Lỗi Server'});
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      user_id, name, address, category, review_text, rating, lat, lng, image_url
    } = req.body;

    const query = `
        INSERT INTO locations
        (user_id, name, address, category, review_text, rating, lat, lng, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *;
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
      image_url || null
    ];

    const result = await pool.query(query, values);
    res.status(201).json({success: true, data: result.rows[0]});
  } catch (error) {
    console.error("Lỗi khi lưu địa điểm:", error);
    res.status(500).json({success: false, message: 'Lỗi Server'});
  }
});

export default router;
