import express from "express";
import {
  createLocationEntry,
  deleteLocationEntry,
  getLocations,
  getTrendingLocations,
  getUserLocations,
  getLocationById
} from "../controllers/locationController.js";

const router = express.Router();

router.get("/", getLocations);
router.post("/", createLocationEntry);
router.get("/user/:uid", getUserLocations);
router.get("/trending", getTrendingLocations);
router.get("/:id", getLocationById);
router.delete("/:id", deleteLocationEntry);

export default router;
