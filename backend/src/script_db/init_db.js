import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupDatabase() {
  const sqlPath = path.join(__dirname, 'db_setup.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    console.log('--- Đang khởi tạo Database từ đầu ---');
    await pool.query(sql);
    console.log('--- Khởi tạo Database THÀNH CÔNG ! ---');
  } catch (err) {
    console.error('Lỗi khi khởi tạo database:', err);
  } finally {
    await pool.end();
  }
}

setupDatabase();
