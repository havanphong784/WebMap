import pg from "pg";
import "dotenv/config";

const {Pool, types} = pg;

types.setTypeParser(1114, (val) => val);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

pool.connect((err) => {
  if (err) {
    console.error("Database: Lỗi kết nối !", err.stack);
  } else {
    console.log("Database: Kết nối PostgreSQL thành công !");
  }
});

export default pool;
