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
  getDirections,
  searchAddress,
  getGoongPlace,
  getFollowingLocations
} from "../controllers/locationController.js";
import {optionalVerifyToken, verifyToken} from "../middlewares/authMiddleware.js";

const router = express.Router();

// Read endpoints: optional auth để có uid khi tính is_liked / locations riêng tư của chính user.
router.get("/", optionalVerifyToken, getLocations);
router.get("/user/:uid", optionalVerifyToken, getUserLocations);
router.get("/trending", optionalVerifyToken, getTrendingLocations);
router.get("/tags", getUniqueTags);
router.get("/tag/:tag", optionalVerifyToken, getLocationsByTag);

// Following feed: bắt buộc đăng nhập (lấy userId từ token).
router.get("/following", verifyToken, getFollowingLocations);

// Goong proxy: yêu cầu auth để chống abuse API key của server.
router.get("/geocoding/reverse", verifyToken, reverseGeocode);
router.get("/geocoding/search", verifyToken, searchAddress);
router.get("/goong/place-detail", verifyToken, getGoongPlace);
router.get("/routing", verifyToken, getDirections);

router.get("/:id", optionalVerifyToken, getLocationById);

// Write endpoints: bắt buộc auth, lấy userId từ req.user.uid.
router.post("/", verifyToken, createLocationEntry);
router.delete("/:id", verifyToken, deleteLocationEntry);

export default router;
