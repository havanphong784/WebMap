import express from "express";
import pool from "../config/db.js";
import {verifyToken} from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/login", verifyToken, async (req, res) => {
  try {
    const {uid, email, name, picture} = req.user;

    const query = `
        INSERT INTO users (firebase_uid, email, name, avatar_url)
        VALUES ($1, $2, $3, $4) ON CONFLICT (firebase_uid) 
      DO
        UPDATE SET
            name = EXCLUDED.name,
            avatar_url = EXCLUDED.avatar_url,
            updated_at = NOW()
            RETURNING *;
    `;
    const values = [uid, email, name, picture];

    const result = await pool.query(query, values);
    const savedUser = result.rows[0];

    res.status(200).json({message: "Đăng nhập thành công", user: savedUser});
  } catch (error) {
    console.error("Lỗi khi lưu user:", error);
    res.status(500).json({error: "Lỗi Server nội bộ"});
  }
});

router.get("/:uid", async (req, res) => {
  try {
    const {uid} = req.params;

    const query = `
        SELECT u.*,
               (SELECT COUNT(*) FROM locations WHERE user_id = u.firebase_uid)                  AS total_posts,
               (SELECT COUNT(*)
                FROM likes
                WHERE location_id IN (SELECT id FROM locations WHERE user_id = u.firebase_uid)) AS total_likes_received
        FROM users u
        WHERE u.firebase_uid = $1;
    `;

    const result = await pool.query(query, [uid]);

    if (result.rows.length === 0) {
      return res.status(404).json({success: false, message: "Không tìm thấy người dùng"});
    }

    res.status(200).json({success: true, user: result.rows[0]});
  } catch (error) {
    console.error("Lỗi khi lấy profile:", error);
    res.status(500).json({error: "Lỗi Server"});
  }
});

export default router;

