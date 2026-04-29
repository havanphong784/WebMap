import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/:id/comments', async (req, res) => {
  try {
    const query = `
        SELECT c.*, u.name, u.avatar_url
        FROM comments c
                 JOIN users u ON c.user_id = u.firebase_uid
        WHERE c.location_id = $1
        ORDER BY c.created_at DESC
    `;
    const result = await pool.query(query, [req.params.id]);
    res.json({success: true, data: result.rows});
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

router.post('/:id/comments', async (req, res) => {
  const {user_id, content} = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO comments (user_id, location_id, content) VALUES ($1, $2, $3) RETURNING *',
      [user_id, req.params.id, content]
    );
    res.json({success: true, data: result.rows[0]});
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

export default router;