import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.post('/:id/like', async (req, res) => {
  const {user_id} = req.body;
  const location_id = req.params.id;

  try {
    const check = await pool.query(
      'SELECT * FROM likes WHERE user_id = $1 AND location_id = $2',
      [user_id, location_id]
    );

    if (check.rows.length > 0) {
      await pool.query(
        'DELETE FROM likes WHERE user_id = $1 AND location_id = $2',
        [user_id, location_id]
      );
      return res.json({success: true, action: 'unliked'});
    } else {
      await pool.query(
        'INSERT INTO likes (user_id, location_id) VALUES ($1, $2)',
        [user_id, location_id]
      );
      return res.json({success: true, action: 'liked'});
    }
  } catch (err) {
    console.error("Lỗi API Like:", err);
    res.status(500).json({error: "Lỗi Server"});
  }
});

export default router;
