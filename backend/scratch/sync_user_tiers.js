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

async function syncTiers() {
  const updateSql = `
    UPDATE users
    SET 
        level = floor(sqrt(xp / 100)) + 1,
        tier = CASE
            WHEN floor(sqrt(xp / 100)) + 1 >= 100 THEN 'Master of Aether'
            WHEN floor(sqrt(xp / 100)) + 1 >= 75 THEN 'Legend'
            WHEN floor(sqrt(xp / 100)) + 1 >= 50 THEN 'Vanguard'
            WHEN floor(sqrt(xp / 100)) + 1 >= 25 THEN 'Pathfinder'
            WHEN floor(sqrt(xp / 100)) + 1 >= 10 THEN 'Explorer'
            ELSE 'Wanderer'
        END,
        updated_at = CURRENT_TIMESTAMP;
  `;

  try {
    console.log("--- Bắt đầu đồng bộ hóa Level và Tier cho toàn bộ người dùng ---");
    const res = await pool.query(updateSql);
    console.log(`--- Đồng bộ thành công cho ${res.rowCount} người dùng! ---`);
  } catch (err) {
    console.error("Lỗi khi đồng bộ hóa:", err);
  } finally {
    await pool.end();
  }
}

syncTiers();
