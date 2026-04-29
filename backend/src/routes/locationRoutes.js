import express from "express";
import {
  createLocationEntry,
  getLocations,
  getTrendingLocations,
  getUserLocations
} from "../controllers/locationController.js";

const router = express.Router();

router.get("/", getLocations);
router.post("/", createLocationEntry);
router.get("/user/:uid", getUserLocations);
router.get("/trending", getTrendingLocations);

export default router;

