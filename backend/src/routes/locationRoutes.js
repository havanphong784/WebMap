import express from "express";
import {
  createLocationEntry,
  deleteLocationEntry,
  getLocations,
  getTrendingLocations,
  getUserLocations,
  getLocationById,
  getLocationsByTag,
  getUniqueTags,
  reverseGeocode,
  getDirections
} from "../controllers/locationController.js";

const router = express.Router();

router.get("/", getLocations);
router.post("/", createLocationEntry);
router.get("/user/:uid", getUserLocations);
router.get("/trending", getTrendingLocations);
router.get("/tags", getUniqueTags);
router.get("/geocoding/reverse", reverseGeocode);
router.get("/routing", getDirections);
router.get("/tag/:tag", getLocationsByTag);
router.get("/:id", getLocationById);
router.delete("/:id", deleteLocationEntry);

export default router;
