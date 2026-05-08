import express from "express";
import { getWeather, getTile } from "../controllers/weatherController.js";

const router = express.Router();

router.get("/", getWeather);
router.get("/tile/:layer/:z/:x/:y", getTile);

export default router;
