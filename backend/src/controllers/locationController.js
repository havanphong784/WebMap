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
import {addXP} from "../services/gamificationService.js";
import {getFollowers} from "../services/followService.js";
import {createNotification} from "../services/notificationService.js";
import {
  getRouteForPoints,
  getGoongPlaceDetail,
  isConfiguredGoongKey,
  parseLngLatString,
  reverseGeocodeWithGoong,
  searchAddressWithGoong
} from "../services/goongMapService.js";
import {sendError, sendSuccess} from "../utils/apiResponse.js";

const geocodingCache = new Map();
const MAX_CACHE_SIZE = 1000;
const GEOCODING_TTL_MS = 24 * 60 * 60 * 1000; // 24h

const getViewerId = (req) => req.user?.uid || null;

export const getLocations = async (req, res) => {
  try {
    const {minLng, maxLng, minLat, maxLat} = req.query;

    if (!minLng || !maxLng || !minLat || !maxLat) {
      return sendSuccess(res, {data: [], message: "Thiếu tham số tọa độ"});
    }

    const data = await listLocations({
      userId: getViewerId(req),
      minLng: parseFloat(minLng),
      maxLng: parseFloat(maxLng),
      minLat: parseFloat(minLat),
      maxLat: parseFloat(maxLat)
    });
    sendSuccess(res, {data});
  } catch (error) {
    console.error("Lỗi lấy danh sách địa điểm:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const createLocationEntry = async (req, res) => {
  try {
    const userId = req.user.uid;
    const {tags, user_id: _ignored, ...rest} = req.body;
    const normalizedTags = Array.isArray(tags)
      ? tags.map(t => t.trim().toLowerCase()).filter(Boolean)
      : [];
    const saved = await createLocation({...rest, user_id: userId, tags: normalizedTags});

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

      if (saved.is_public) {
        const followers = await getFollowers(saved.user_id);
        for (const follower of followers) {
          await createNotification({
            recipientId: follower.firebase_uid,
            senderId: saved.user_id,
            type: "NEW_POST",
            message: `đã đăng một địa điểm mới: ${saved.name}`,
            locationId: saved.id
          });
        }
      }
    }

    sendSuccess(res, {status: 201, data: saved});
  } catch (error) {
    console.error("Lỗi khi lưu địa điểm:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const getUserLocations = async (req, res) => {
  try {
    const {uid} = req.params;
    const data = await listUserLocations({uid, currentUserId: getViewerId(req)});
    sendSuccess(res, {data});
  } catch (error) {
    console.error("Lỗi lấy địa điểm theo User:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const getTrendingLocations = async (req, res) => {
  try {
    const data = await listTrendingLocations({userId: getViewerId(req)});
    sendSuccess(res, {data});
  } catch (error) {
    console.error("Lỗi lấy địa điểm xu hướng:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const getFollowingLocations = async (req, res) => {
  try {
    const userId = req.user.uid;
    const data = await listFollowingLocations({userId});
    sendSuccess(res, {data});
  } catch (error) {
    console.error("Lỗi lấy địa điểm của người đang theo dõi:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const deleteLocationEntry = async (req, res) => {
  try {
    const {id} = req.params;
    const deleted = await deleteLocation({locationId: id, userId: req.user.uid});
    sendSuccess(res, {data: deleted});
  } catch (error) {
    console.error("Lỗi xóa địa điểm:", error);
    sendError(res, {status: 403, code: "LOCATION_DELETE_FORBIDDEN", message: error.message || "Không thể xoá"});
  }
};

export const getLocationById = async (req, res) => {
  try {
    const {id} = req.params;
    const data = await getLocationDetail({locationId: id, userId: getViewerId(req)});
    if (!data) {
      return sendError(res, {status: 404, code: "LOCATION_NOT_FOUND", message: "Không tìm thấy địa điểm"});
    }
    sendSuccess(res, {data});
  } catch (error) {
    console.error("Lỗi lấy chi tiết địa điểm:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const getLocationsByTag = async (req, res) => {
  try {
    const {tag} = req.params;
    const data = await listLocationsByTag({tag, userId: getViewerId(req)});
    sendSuccess(res, {data});
  } catch (error) {
    console.error("Lỗi lọc địa điểm theo tag:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const getUniqueTags = async (req, res) => {
  try {
    const data = await listUniqueTags();
    sendSuccess(res, {data});
  } catch (error) {
    console.error("Lỗi lấy danh sách tag:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const reverseGeocode = async (req, res) => {
  const {lat, lng} = req.query;
  if (!lat || !lng) {
    return sendError(res, {status: 400, code: "GEO_COORDS_REQUIRED", message: "Thiếu tọa độ"});
  }

  const cacheKey = `${parseFloat(lat).toFixed(5)},${parseFloat(lng).toFixed(5)}`;
  const cached = geocodingCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < GEOCODING_TTL_MS) {
    return sendSuccess(res, {data: cached.data});
  }

  if (!isConfiguredGoongKey()) {
    return sendError(res, {status: 503, code: "GOONG_NOT_CONFIGURED", message: "Chưa cấu hình GOONG_API_KEY"});
  }

  try {
    const result = await reverseGeocodeWithGoong({lat, lng});
    geocodingCache.set(cacheKey, {data: result, timestamp: Date.now()});
    if (geocodingCache.size > MAX_CACHE_SIZE) {
      geocodingCache.delete(geocodingCache.keys().next().value);
    }
    sendSuccess(res, {data: result});
  } catch (error) {
    console.error("Goong reverse geocoding failed:", error.message);
    sendError(res, {status: 502, code: "GOONG_REVERSE_FAILED", message: "Không thể xác định địa chỉ từ Goong"});
  }
};

export const getDirections = async (req, res) => {
  try {
    if (!isConfiguredGoongKey()) {
      return sendError(res, {status: 503, code: "GOONG_NOT_CONFIGURED", message: "Chưa cấu hình GOONG_API_KEY"});
    }

    const {start, end, points} = req.query;
    const routePoints = points
      ? points.split(";").map(parseLngLatString)
      : [parseLngLatString(start), parseLngLatString(end)];

    if (routePoints.length < 2 || routePoints.some(point => !point)) {
      return sendError(res, {status: 400, code: "ROUTE_INVALID", message: "Tọa độ không hợp lệ"});
    }

    const route = await getRouteForPoints(routePoints);
    return res.status(200).json({success: true, routes: [route]});
  } catch (error) {
    console.error("Goong routing failed:", error);
    sendError(res, {status: 502, code: "GOONG_ROUTING_FAILED", message: "Không thể lấy dữ liệu chỉ đường từ Goong"});
  }
};

export const searchAddress = async (req, res) => {
  try {
    const {q, location, origin} = req.query;
    if (!q) {
      return sendError(res, {status: 400, code: "SEARCH_QUERY_REQUIRED", message: "Thiếu từ khóa tìm kiếm"});
    }

    if (!isConfiguredGoongKey()) {
      return sendError(res, {status: 503, code: "GOONG_NOT_CONFIGURED", message: "Chưa cấu hình GOONG_API_KEY"});
    }

    const data = await searchAddressWithGoong(q, {limit: 5, location, origin});
    sendSuccess(res, {data});
  } catch (error) {
    console.error("Goong address search failed:", error);
    sendError(res, {status: 502, code: "GOONG_SEARCH_FAILED", message: "Tìm kiếm thất bại trên Goong"});
  }
};

export const getGoongPlace = async (req, res) => {
  try {
    const {place_id} = req.query;
    if (!place_id) {
      return sendError(res, {status: 400, code: "PLACE_ID_REQUIRED", message: "Thiếu place_id"});
    }

    if (!isConfiguredGoongKey()) {
      return sendError(res, {status: 503, code: "GOONG_NOT_CONFIGURED", message: "Chưa cấu hình GOONG_API_KEY"});
    }

    const data = await getGoongPlaceDetail(place_id);
    sendSuccess(res, {data});
  } catch (error) {
    console.error("Goong place detail failed:", error);
    sendError(res, {
      status: error.status || 502,
      code: error.code || "GOONG_PLACE_FAILED",
      message: error.message || "Không thể lấy chi tiết địa điểm từ Goong",
    });
  }
};
