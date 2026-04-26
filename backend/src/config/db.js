import pg from "pg";
import "dotenv/config";

const {Pool} = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.connect((err) => {
  if (err) {
    console.error("Database: Lỗi kết nối !", err.stack);
  } else {
    console.log("Database: Kết nối PostgreSQL thành công !");
  }
});

export default pool;
