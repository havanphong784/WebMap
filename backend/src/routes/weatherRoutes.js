import express from "express";
import {getWeather, getTile} from "../controllers/weatherController.js";
import {verifyToken} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Data endpoint: yêu cầu auth để chống abuse API key.
router.get("/", verifyToken, getWeather);

// Tile endpoint: MapLibre gọi trực tiếp qua URL (không gửi được Bearer token),
// nên không thể yêu cầu auth. Đã có Cache-Control 1h và rate limit riêng ở app.js bỏ qua tiles.
router.get("/tile/:layer/:z/:x/:y", getTile);

export default router;
