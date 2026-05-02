import pg from "pg";
import "dotenv/config";

const {Pool, types} = pg;

// Ép kiểu TIMESTAMP (OID 1114) trả về chuỗi nguyên bản, không tự chuyển sang Date của JS
// Giúp tránh việc Node.js tự cộng/trừ múi giờ gây lệch 7 tiếng
types.setTypeParser(1114, (val) => val);

// Ép buộc Node.js bỏ qua kiểm tra chứng chỉ SSL (Nuclear Option)
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
