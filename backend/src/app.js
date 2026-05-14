import "dotenv/config";
import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import likeRoutes from "./routes/likeRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import achievementRoutes from "./routes/achievementRoutes.js";
import followRoutes from "./routes/followRoutes.js";
import weatherRoutes from "./routes/weatherRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import sseRoutes from "./routes/sseRoutes.js";
import {errorHandler, notFoundHandler} from "./middlewares/errorHandler.js";
import {normalizeApiResponse} from "./middlewares/normalizeResponse.js";
import {createRateLimiter} from "./middlewares/rateLimit.js";

const app = express();
const PORT = process.env.PORT || 3000;

// CORS allowlist (đặt FRONTEND_ORIGINS="https://a.com,https://b.com" trong .env)
const allowedOrigins = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map(item => item.trim())
  .filter(Boolean);

const isDev = process.env.NODE_ENV !== "production";

const corsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    // Cho phép tools như curl/Postman không gửi origin
    if (!origin) return callback(null, true);
    if (isDev && allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} không được phép bởi CORS`));
  },
};

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({limit: "1mb"}));
app.use(normalizeApiResponse);

// Rate limiters dùng chung
const authLimiter = createRateLimiter({windowMs: 60_000, max: 30, code: "AUTH_RATE_LIMITED"});
const heartbeatLimiter = createRateLimiter({windowMs: 60_000, max: 30, code: "HEARTBEAT_RATE_LIMITED"});
const externalProxyLimiter = createRateLimiter({windowMs: 60_000, max: 60, code: "PROXY_RATE_LIMITED"});
const chatbotLimiter = createRateLimiter({windowMs: 60_000, max: 20, code: "CHATBOT_RATE_LIMITED"});
const writeLimiter = createRateLimiter({windowMs: 60_000, max: 60, code: "WRITE_RATE_LIMITED"});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/heartbeat", heartbeatLimiter);
// Chỉ limit endpoint lấy data thời tiết, KHÔNG limit tiles vì map gọi hàng chục tile cùng lúc.
app.use("/api/weather", (req, res, next) => {
  // Bỏ qua rate limit cho tile requests (đã có Cache-Control 1h).
  if (req.path.startsWith("/tile/")) return next();
  return externalProxyLimiter(req, res, next);
});
app.use("/api/locations/geocoding", externalProxyLimiter);
app.use("/api/locations/routing", externalProxyLimiter);
app.use("/api/locations/goong", externalProxyLimiter);
app.use("/api/chatbot", chatbotLimiter);
app.use(["/api/likes", "/api/comments", "/api/follows", "/api/messages"], writeLimiter);

app.use("/api/sse", sseRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/messages", messageRoutes);

app.get("/health", (req, res) => {
  res.json({success: true, message: "Server Backend đang chạy!"});
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});
