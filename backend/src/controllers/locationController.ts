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
import type {AsyncRequestHandler, AuthenticatedRequest} from "../types/http.js";

const getViewerId = (req: AuthenticatedRequest): string | null => req.user?.uid || null;

export const getLocations: AsyncRequestHandler = async (req, res) => {
  try {
    const {minLng, maxLng, minLat, maxLat, page, limit} = req.query as Record<string, string | undefined>;

    if (!minLng || !maxLng || !minLat || !maxLat) {
      return sendSuccess(res, {data: [], pagination: {page: 1, limit: 20, total: 0, totalPages: 0}, message: "Thiếu tham số tọa độ"});
    }

    const result = await listLocations({
      userId: getViewerId(req),
      minLng: parseFloat(minLng),
      maxLng: parseFloat(maxLng),
      minLat: parseFloat(minLat),
      maxLat: parseFloat(maxLat),
      page: parseInt(page || "1", 10) || 1,
      limit: parseInt(limit || "500", 10) || 500
    });
    sendSuccess(res, result);
  } catch (error) {
    console.error("Lỗi lấy danh sách địa điểm:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const createLocationEntry: AsyncRequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return sendError(res, {status: 401, message: "Yêu cầu đăng nhập"});
    }
    const {tags, user_id: _ignored, ...rest} = req.body;
    const normalizedTags = Array.isArray(tags)
      ? tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean)
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
        // Use Promise.all for parallel notification creation instead of sequential
        await Promise.all(
          followers.map(follower =>
            createNotification({
              recipientId: follower.firebase_uid,
              senderId: saved.user_id,
              type: "NEW_POST",
              message: `đã đăng một địa điểm mới: ${saved.name}`,
              locationId: saved.id
            }).catch(err => {
              console.error(`Failed to notify ${follower.firebase_uid}:`, err);
              // Don't throw, continue with other notifications
            })
          )
        );
      }
    }

    sendSuccess(res, {status: 201, data: saved});
  } catch (error) {
    console.error("Lỗi khi lưu địa điểm:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const getUserLocations: AsyncRequestHandler = async (req, res) => {
  try {
    const {uid} = req.params as {uid: string};
    const {page, limit} = req.query as Record<string, string | undefined>;
    const result = await listUserLocations({
      uid,
      currentUserId: getViewerId(req),
      page: parseInt(page || "1", 10) || 1,
      limit: parseInt(limit || "20", 10) || 20
    });
    sendSuccess(res, result);
  } catch (error) {
    console.error("Lỗi lấy địa điểm theo User:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const getTrendingLocations: AsyncRequestHandler = async (req, res) => {
  try {
    const {page, limit} = req.query as Record<string, string | undefined>;
    const result = await listTrendingLocations({
      userId: getViewerId(req),
      page: parseInt(page || "1", 10) || 1,
      limit: parseInt(limit || "20", 10) || 20
    });
    sendSuccess(res, result);
  } catch (error) {
    console.error("Lỗi lấy địa điểm xu hướng:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const getFollowingLocations: AsyncRequestHandler = async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return sendError(res, {status: 401, message: "Yêu cầu đăng nhập"});
    }
    const {page, limit} = req.query as Record<string, string | undefined>;
    const result = await listFollowingLocations({
      userId,
      page: parseInt(page || "1", 10) || 1,
      limit: parseInt(limit || "20", 10) || 20
    });
    sendSuccess(res, result);
  } catch (error) {
    console.error("Lỗi lấy địa điểm của người đang theo dõi:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const deleteLocationEntry: AsyncRequestHandler = async (req, res) => {
  try {
    const {id} = req.params as {id: string};
    const userId = req.user?.uid;
    if (!userId) {
      return sendError(res, {status: 401, message: "Yêu cầu đăng nhập"});
    }
    const deleted = await deleteLocation({locationId: id, userId});
    sendSuccess(res, {data: deleted});
  } catch (error: any) {
    console.error("Lỗi xóa địa điểm:", error);
    sendError(res, {status: 403, code: "LOCATION_DELETE_FORBIDDEN", message: error?.message || "Không thể xoá"});
  }
};

export const getLocationById: AsyncRequestHandler = async (req, res) => {
  try {
    const {id} = req.params as {id: string};
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

export const getLocationsByTag: AsyncRequestHandler = async (req, res) => {
  try {
    const {tag} = req.params as {tag: string};
    const {page, limit} = req.query as Record<string, string | undefined>;
    const result = await listLocationsByTag({
      tag,
      userId: getViewerId(req),
      page: parseInt(page || "1", 10) || 1,
      limit: parseInt(limit || "20", 10) || 20
    });
    sendSuccess(res, result);
  } catch (error) {
    console.error("Lỗi lọc địa điểm theo tag:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const getUniqueTags: AsyncRequestHandler = async (_req, res) => {
  try {
    const data = await listUniqueTags();
    sendSuccess(res, {data});
  } catch (error) {
    console.error("Lỗi lấy danh sách tag:", error);
    sendError(res, {status: 500, message: "Lỗi Server"});
  }
};

export const reverseGeocode: AsyncRequestHandler = async (req, res) => {
  const {lat, lng} = req.query as Record<string, string | undefined>;
  if (!lat || !lng) {
    return sendError(res, {status: 400, code: "GEO_COORDS_REQUIRED", message: "Thiếu tọa độ"});
  }

  if (!isConfiguredGoongKey()) {
    return sendError(res, {status: 503, code: "GOONG_NOT_CONFIGURED", message: "Chưa cấu hình GOONG_API_KEY"});
  }

  try {
    const result = await reverseGeocodeWithGoong({lat, lng});
    sendSuccess(res, {data: result});
  } catch (error: any) {
    console.error("Goong reverse geocoding failed:", error?.message);
    sendError(res, {status: 502, code: "GOONG_REVERSE_FAILED", message: "Không thể xác định địa chỉ từ Goong"});
  }
};

export const getDirections: AsyncRequestHandler = async (req, res) => {
  try {
    if (!isConfiguredGoongKey()) {
      return sendError(res, {status: 503, code: "GOONG_NOT_CONFIGURED", message: "Chưa cấu hình GOONG_API_KEY"});
    }

    const {start, end, points} = req.query as Record<string, string | undefined>;
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

export const searchAddress: AsyncRequestHandler = async (req, res) => {
  try {
    const {q, location, origin} = req.query as Record<string, string | undefined>;
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

export const getGoongPlace: AsyncRequestHandler = async (req, res) => {
  try {
    const {place_id} = req.query as Record<string, string | undefined>;
    if (!place_id) {
      return sendError(res, {status: 400, code: "PLACE_ID_REQUIRED", message: "Thiếu place_id"});
    }

    if (!isConfiguredGoongKey()) {
      return sendError(res, {status: 503, code: "GOONG_NOT_CONFIGURED", message: "Chưa cấu hình GOONG_API_KEY"});
    }

    const data = await getGoongPlaceDetail(place_id);
    sendSuccess(res, {data});
  } catch (error: any) {
    console.error("Goong place detail failed:", error);
    sendError(res, {
      status: error?.status || 502,
      code: error?.code || "GOONG_PLACE_FAILED",
      message: error?.message || "Không thể lấy chi tiết địa điểm từ Goong",
    });
  }
};