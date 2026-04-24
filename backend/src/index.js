const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Middleware
app.use(cors()); // Cho phép Frontend truy cập vào API
app.use(express.json()); // Cho phép server đọc dữ liệu định dạng JSON

// 2. Route chạy thử (Check xem server sống không)
app.get('/', (req, res) => {
  res.send('Server Node.js đang chạy thành công!');
});

// 3. Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại: http://localhost:${PORT}`);
});
