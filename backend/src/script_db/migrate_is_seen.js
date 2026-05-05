import pool from "../config/db.js";
import dotenv from "dotenv";
dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function migrate() {
  try {
    console.log("Adding is_seen columns...");
    await pool.query("ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS is_seen BOOLEAN DEFAULT TRUE");
    await pool.query("ALTER TABLE user_daily_tasks ADD COLUMN IF NOT EXISTS is_seen BOOLEAN DEFAULT TRUE");
    console.log("Migration successful.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
