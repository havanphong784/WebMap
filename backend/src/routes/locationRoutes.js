import express from "express";
import {
  createLocationEntry,
  deleteLocationEntry,
  getLocations,
  getTrendingLocations,
  getUserLocations
} from "../controllers/locationController.js";

const router = express.Router();

router.get("/", getLocations);
router.post("/", createLocationEntry);
router.get("/user/:uid", getUserLocations);
router.get("/trending", getTrendingLocations);
router.delete("/:id", deleteLocationEntry);

export default router;
