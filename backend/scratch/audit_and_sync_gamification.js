import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const XP_CONFIG = {
  PHOTO: 10,
  REVIEW: 5,
  LONG_REVIEW: 20,
  LIKE_RECEIVED: 1,
  LIKE_GIVEN: 2,
  COMMENT: 3,
  LOCATION_CREATED: 30
};

async function auditGamification() {
  try {
    console.log("--- Bắt đầu Audit toàn bộ hệ thống Gamification ---");

    const users = await pool.query("SELECT firebase_uid FROM users");
    const achievements = await pool.query("SELECT * FROM achievements");

    for (const user of users.rows) {
      const uid = user.firebase_uid;

      // 1. Đếm số lượng hành động thực tế
      const stats = {
        location_count: parseInt((await pool.query("SELECT COUNT(*) FROM locations WHERE user_id = $1", [uid])).rows[0].count),
        photo_count: parseInt((await pool.query("SELECT COUNT(*) FROM locations WHERE user_id = $1 AND image_url IS NOT NULL AND image_url != ''", [uid])).rows[0].count),
        comment_count: parseInt((await pool.query("SELECT COUNT(*) FROM comments WHERE user_id = $1", [uid])).rows[0].count),
        like_given_count: parseInt((await pool.query("SELECT COUNT(*) FROM likes WHERE user_id = $1", [uid])).rows[0].count),
        like_received_count: parseInt((await pool.query("SELECT COUNT(*) FROM likes l JOIN locations loc ON l.location_id = loc.id WHERE loc.user_id = $1", [uid])).rows[0].count),
        long_review_count: parseInt((await pool.query("SELECT COUNT(*) FROM locations WHERE user_id = $1 AND length(review_text) > 20", [uid])).rows[0].count),
        review_count: parseInt((await pool.query("SELECT COUNT(*) FROM locations WHERE user_id = $1", [uid])).rows[0].count)
      };

      let totalBaseXP = 0;
      totalBaseXP += stats.location_count * XP_CONFIG.LOCATION_CREATED;
      totalBaseXP += stats.photo_count * XP_CONFIG.PHOTO;
      totalBaseXP += stats.comment_count * XP_CONFIG.COMMENT;
      totalBaseXP += stats.like_given_count * XP_CONFIG.LIKE_GIVEN;
      totalBaseXP += stats.like_received_count * XP_CONFIG.LIKE_RECEIVED;
      totalBaseXP += (stats.review_count - stats.long_review_count) * XP_CONFIG.REVIEW;
      totalBaseXP += stats.long_review_count * XP_CONFIG.LONG_REVIEW;

      let totalAchievementXP = 0;

      // 2. Cập nhật tiến trình thành tựu và tính XP thưởng
      for (const ach of achievements.rows) {
        const progress = stats[ach.requirement_type] || 0;
        const isUnlocked = progress >= ach.requirement_value;

        await pool.query(
          `INSERT INTO user_achievements (user_id, achievement_id, progress, is_unlocked, unlocked_at, is_seen)
           VALUES ($1, $2, $3, $4, $5, TRUE)
           ON CONFLICT (user_id, achievement_id) DO UPDATE SET
           progress = EXCLUDED.progress,
           is_unlocked = EXCLUDED.is_unlocked,
           unlocked_at = CASE WHEN EXCLUDED.is_unlocked AND user_achievements.is_unlocked = FALSE THEN CURRENT_TIMESTAMP ELSE user_achievements.unlocked_at END`,
          [uid, ach.id, progress, isUnlocked, isUnlocked ? new Date() : null]
        );

        if (isUnlocked) {
          totalAchievementXP += ach.xp_reward;
        }
      }

      const totalXP = totalBaseXP + totalAchievementXP;

      // 3. Cập nhật lại User
      await pool.query(
        `UPDATE users
         SET xp = $1,
             level = floor(sqrt($1 / 100)) + 1,
             tier = CASE
                WHEN floor(sqrt($1 / 100)) + 1 >= 100 THEN 'Master of Aether'
                WHEN floor(sqrt($1 / 100)) + 1 >= 75 THEN 'Legend'
                WHEN floor(sqrt($1 / 100)) + 1 >= 50 THEN 'Vanguard'
                WHEN floor(sqrt($1 / 100)) + 1 >= 25 THEN 'Pathfinder'
                WHEN floor(sqrt($1 / 100)) + 1 >= 10 THEN 'Explorer'
                ELSE 'Wanderer'
             END,
             updated_at = CURRENT_TIMESTAMP
         WHERE firebase_uid = $2`,
        [totalXP, uid]
      );
    }

    console.log("--- Audit và Đồng bộ hóa Gamification HOÀN TẤT! ---");
  } catch (err) {
    console.error("Lỗi trong quá trình Audit:", err);
  } finally {
    await pool.end();
  }
}

auditGamification();
