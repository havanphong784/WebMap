import {
  createLocation,
  listLocations,
  listTrendingLocations,
  listUserLocations
} from "../services/locationService.js";

export const getLocations = async (req, res) => {
  try {
    const { user_id, minLng, maxLng, minLat, maxLat } = req.query;
    const data = await listLocations({
      userId: user_id,
      minLng,
      maxLng,
      minLat,
      maxLat
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Lỗi lấy danh sách địa điểm:", error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

export const createLocationEntry = async (req, res) => {
  try {
    const saved = await createLocation(req.body);
    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    console.error("Lỗi khi lưu địa điểm:", error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

export const getUserLocations = async (req, res) => {
  try {
    const { uid } = req.params;
    const { current_user_id } = req.query;
    const data = await listUserLocations({ uid, currentUserId: current_user_id });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Lỗi lấy địa điểm theo User:", error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

export const getTrendingLocations = async (req, res) => {
  try {
    const { user_id } = req.query;
    const data = await listTrendingLocations({ userId: user_id });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Lỗi lấy địa điểm xu hướng:", error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

