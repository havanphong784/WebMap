import pg from "pg";
import "dotenv/config";

const { Pool, types } = pg;

types.setTypeParser(1114, (val) => val);

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on("error", (err) => {
  console.error("Lỗi PostgreSQL Pool bất ngờ:", err.message);
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("Database: Lỗi kết nối !", err.stack);
  } else {
    console.log("Database: Kết nối PostgreSQL thành công !");
    release();
  }
});

export default pool;
