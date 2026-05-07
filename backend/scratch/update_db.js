import fs from "fs";
import dotenv from "dotenv";
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
dotenv.config({ path: "../.env" });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setup() {
  const sql = `
CREATE TABLE IF NOT EXISTS follows (
    follower_id VARCHAR(128) NOT NULL REFERENCES users(firebase_uid) ON DELETE CASCADE,
    followed_id VARCHAR(128) NOT NULL REFERENCES users(firebase_uid) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, followed_id)
);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed ON follows(followed_id);
  `;
  try {
    await pool.query(sql);
    console.log("Follows table created!");
    
    // Append to db_setup.sql
    fs.appendFileSync("../src/script_db/db_setup.sql", sql);
    console.log("Appended to db_setup.sql");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
setup();
