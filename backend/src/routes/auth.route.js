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

export default router;
