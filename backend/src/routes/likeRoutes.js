import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// POST /api/likes/:id/like - Thả tim hoặc Bỏ thích
router.post('/:id/like', async (req, res) => {
  const { user_id } = req.body;
  const location_id = req.params.id;

  try {
    // 1. Kiểm tra xem người dùng đã Like địa điểm này chưa
    const check = await pool.query(
      'SELECT * FROM likes WHERE user_id = $1 AND location_id = $2', 
      [user_id, location_id]
    );

    if (check.rows.length > 0) {
      // 2. Nếu đã Like rồi -> Tiến hành UNLIKE (Xóa khỏi bảng)
      await pool.query(
        'DELETE FROM likes WHERE user_id = $1 AND location_id = $2', 
        [user_id, location_id]
      );
      return res.json({ success: true, action: 'unliked' });
    } else {
      // 3. Nếu chưa Like -> Tiến hành LIKE (Thêm vào bảng)
      await pool.query(
        'INSERT INTO likes (user_id, location_id) VALUES ($1, $2)', 
        [user_id, location_id]
      );
      return res.json({ success: true, action: 'liked' });
    }
  } catch (err) {
    console.error("Lỗi API Like:", err);
    res.status(500).json({ error: "Lỗi Server" });
  }
});

export default router;