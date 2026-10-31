import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function setupDatabase(): Promise<void> {
  const sqlPath = path.join(__dirname, "db_setup.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  try {
    console.log("--- Đang khởi tạo Database từ đầu ---");
    await pool.query(sql);
    console.log("--- Khởi tạo Database THÀNH CÔNG ! ---");
  } catch (err) {
    console.error("Lỗi khi khởi tạo database:", err);
  } finally {
    await pool.end();
  }
}

setupDatabase();
