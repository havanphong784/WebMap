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

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/achievements", achievementRoutes);
app.use("/api/follows", followRoutes);
app.use("/api/weather", weatherRoutes);

app.get("/health", (req, res) => {
  res.json({message: "Server Backend đang chạy !"});
});

app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});

