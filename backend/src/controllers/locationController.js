import {
  createLocation,
  deleteLocation,
  getLocationDetail,
  listLocations,
  listLocationsByTag,
  listTrendingLocations,
  listUniqueTags,
  listUserLocations,
  listFollowingLocations
} from "../services/locationService.js";
import { addXP } from "../services/gamificationService.js";
import { getFollowers } from "../services/followService.js";
import { createNotification } from "../services/notificationService.js";
import {
  getRouteForPoints,
  getGoongPlaceDetail,
  isConfiguredGoongKey,
  parseLngLatString,
  reverseGeocodeWithGoong,
  searchAddressWithGoong
} from "../services/goongMapService.js";

const geocodingCache = new Map();
const MAX_CACHE_SIZE = 1000;

export const getLocations = async (req, res) => {
  try {
    const { user_id, minLng, maxLng, minLat, maxLat } = req.query;

    if (!minLng || !maxLng || !minLat || !maxLat) {
      return res.status(200).json({ success: true, data: [], message: "Thiếu tham số tọa độ" });
    }

    const data = await listLocations({
      userId: user_id,
      minLng: parseFloat(minLng),
      maxLng: parseFloat(maxLng),
      minLat: parseFloat(minLat),
      maxLat: parseFloat(maxLat)
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Lỗi lấy danh sách địa điểm:", error);
    res.status(500).json({ success: false, message: "Lỗi Server", detail: error.message });
  }
};

export const createLocationEntry = async (req, res) => {
  try {
    const { tags, ...rest } = req.body;
    const normalizedTags = Array.isArray(tags)
      ? tags.map(t => t.trim().toLowerCase()).filter(Boolean)
      : [];
    const saved = await createLocation({ ...rest, tags: normalizedTags });

    if (saved) {
      await addXP(saved.user_id, "LOCATION_CREATED");
      if (saved.image_url) {
        await addXP(saved.user_id, "PHOTO");
      }

      if (saved.review_text) {
        const wordCount = saved.review_text.trim().split(/\s+/).length;
        if (wordCount >= 10) {
          await addXP(saved.user_id, "LONG_REVIEW");
        } else if (saved.review_text.length > 5) {
          await addXP(saved.user_id, "REVIEW");
        }
      }

      // Notify followers ONLY if public
      if (saved.is_public) {
        const followers = await getFollowers(saved.user_id);
        for (const f of followers) {
          await createNotification({
            recipientId: f.firebase_uid,
            senderId: saved.user_id,
            type: "NEW_POST",
            message: `đã đăng một địa điểm mới: ${saved.name}`,
            locationId: saved.id
          });
        }
      }
    }

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

export const getFollowingLocations = async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.status(400).json({ success: false, message: "Thiếu user_id" });
    }
    const data = await listFollowingLocations({ userId: user_id });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Lỗi lấy địa điểm của người đang theo dõi:", error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

export const deleteLocationEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    const deleted = await deleteLocation({ locationId: id, userId: user_id });
    res.status(200).json({ success: true, data: deleted });
  } catch (error) {
    console.error("Lỗi xóa địa điểm:", error);
    res.status(403).json({ success: false, message: error.message || "Lỗi Server" });
  }
};

export const getLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;
    const data = await getLocationDetail({ locationId: id, userId: user_id });
    if (!data) {
      return res.status(404).json({ success: false, message: "Không tìm thấy địa điểm" });
    }
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Lỗi lấy chi tiết địa điểm:", error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

export const getLocationsByTag = async (req, res) => {
  try {
    const { tag } = req.params;
    const { user_id } = req.query;
    const data = await listLocationsByTag({ tag, userId: user_id });
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Lỗi lọc địa điểm theo tag:", error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

export const getUniqueTags = async (req, res) => {
  try {
    const data = await listUniqueTags();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Lỗi lấy danh sách tag:", error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

export const reverseGeocode = async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ success: false, message: "Thiếu tọa độ" });
  }

  const cacheKey = `${parseFloat(lat).toFixed(5)},${parseFloat(lng).toFixed(5)}`;
  if (geocodingCache.has(cacheKey)) {
    return res.status(200).json(geocodingCache.get(cacheKey));
  }

  if (!isConfiguredGoongKey()) {
    return res.status(503).json({ success: false, message: "Chưa cấu hình GOONG_API_KEY" });
  }

  try {
    const result = await reverseGeocodeWithGoong({lat, lng});
    geocodingCache.set(cacheKey, result);
    if (geocodingCache.size > MAX_CACHE_SIZE) {
      geocodingCache.delete(geocodingCache.keys().next().value);
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error("Goong reverse geocoding failed:", error.message);
    return res.status(502).json({ success: false, message: "Không thể xác định địa chỉ từ Goong" });
  }
};

export const getDirections = async (req, res) => {
  try {
    if (!isConfiguredGoongKey()) {
      return res.status(503).json({ success: false, message: "Chưa cấu hình GOONG_API_KEY" });
    }

    const { start, end, points } = req.query;
    const routePoints = points
      ? points.split(";").map(parseLngLatString)
      : [parseLngLatString(start), parseLngLatString(end)];

    if (routePoints.length < 2 || routePoints.some(point => !point)) {
      return res.status(400).json({ success: false, message: "Tọa độ không hợp lệ" });
    }

    const route = await getRouteForPoints(routePoints);
    return res.status(200).json({ success: true, routes: [route] });
  } catch (error) {
    console.error("Goong routing failed:", error);
    res.status(502).json({ success: false, message: "Không thể lấy dữ liệu chỉ đường từ Goong" });
  }
};

export const searchAddress = async (req, res) => {
  try {
    const { q, location, origin } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: "Thiếu từ khóa tìm kiếm" });
    }

    if (!isConfiguredGoongKey()) {
      return res.status(503).json({ success: false, message: "Chưa cấu hình GOONG_API_KEY" });
    }

    const data = await searchAddressWithGoong(q, {limit: 5, location, origin});
    return res.status(200).json(data);
  } catch (error) {
    console.error("Goong address search failed:", error);
    res.status(502).json({ success: false, message: "Tìm kiếm thất bại trên Goong" });
  }
};

export const getGoongPlace = async (req, res) => {
  try {
    const { place_id } = req.query;
    if (!place_id) {
      return res.status(400).json({ success: false, message: "Thiếu place_id" });
    }

    if (!isConfiguredGoongKey()) {
      return res.status(503).json({ success: false, message: "Chưa cấu hình GOONG_API_KEY" });
    }

    const data = await getGoongPlaceDetail(place_id);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Goong place detail failed:", error);
    res.status(error.status || 502).json({ success: false, message: "Không thể lấy chi tiết địa điểm từ Goong" });
  }
};
