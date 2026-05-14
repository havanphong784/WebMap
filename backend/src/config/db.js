import pg from "pg";
import "dotenv/config";

const {Pool, types} = pg;

types.setTypeParser(1114, (val) => val);

// WORKAROUND: DB cloud (Neon/Supabase/Render) dùng self-signed cert chain.
// pg driver mới (v8.12+) không tôn trọng rejectUnauthorized: false trong mọi trường hợp,
// nên cần biến env này. Nó ảnh hưởng toàn process — chấp nhận được khi chạy trên
// server riêng. Khi có CA cert từ provider, thay bằng ssl.ca option và bỏ dòng này.
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

// Kiểm tra kết nối khi khởi tạo
pool.connect()
  .then(client => {
    console.log("Database: Kết nối PostgreSQL thành công !");
    // Thiết lập múi giờ một lần cho toàn bộ session của client này nếu cần
    // Nhưng cách tốt nhất là set mặc định trong DB hoặc qua connection string
    client.release();
  })
  .catch(err => {
    console.error("Database: Lỗi kết nối !", err.stack);
  });

export default pool;
