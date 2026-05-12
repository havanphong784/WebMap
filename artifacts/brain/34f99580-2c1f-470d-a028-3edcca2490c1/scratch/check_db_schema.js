import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../backend/.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  const tables = ['users', 'locations', 'achievements', 'daily_tasks'];
  
  try {
    console.log('--- Kiểm tra cấu trúc Database ---');
    for (const table of tables) {
      const res = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position;
      `, [table]);
      
      console.log(`\nBảng [${table}]:`);
      if (res.rows.length === 0) {
        console.log('  (!) Bảng không tồn tại');
      } else {
        res.rows.forEach(row => {
          console.log(`  - ${row.column_name} (${row.data_type})`);
        });
      }
    }
  } catch (err) {
    console.error('Lỗi kiểm tra:', err);
  } finally {
    await pool.end();
  }
}

checkSchema();
