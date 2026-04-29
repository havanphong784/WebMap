import "dotenv/config";
import express from "express";
import cors from "cors";
import "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import likeRoutes from "./routes/likeRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/likes", likeRoutes);
app.use("/api/comments", commentRoutes);

app.get("/health", (req, res) => {
  res.json({ message: "Server Backend đang chạy !" });
});

app.listen(PORT, () => {
  console.log(`Server: http://localhost:${PORT}`);
});

