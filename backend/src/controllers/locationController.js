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

  const GOONG_API_KEY = process.env.GOONG_API_KEY;

  if (!GOONG_API_KEY || GOONG_API_KEY === 'YOUR_GOONG_API_KEY') {
    // Fallback if key not set (for development)
    console.warn("Goong API Key is missing, falling back to public services.");
  } else {
    try {
      const response = await fetch(`https://rsapi.goong.io/Geocode?latlng=${lat},${lng}&api_key=${GOONG_API_KEY}`);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const result = {
            display_name: data.results[0].formatted_address,
            address: data.results[0].address_components,
            source: 'goong'
          };
          geocodingCache.set(cacheKey, result);
          return res.status(200).json(result);
        }
      }
    } catch (e) {
      console.warn("Goong Geocode failed:", e.message);
    }
  }

  // Final fallbacks (Nominatim)
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`, {
      headers: { 'User-Agent': 'AetherMapApp/1.0' }
    });
    if (response.ok) {
      const data = await response.json();
      return res.status(200).json(data);
    }
  } catch (e) {
    console.error("Geocoding completely failed", e.message);
  }

  res.status(500).json({ success: false, message: "Không thể xác định địa chỉ" });
};

export const getDirections = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ success: false, message: "Thiếu tọa độ bắt đầu hoặc kết thúc" });
    }

    const GOONG_API_KEY = process.env.GOONG_API_KEY;

    if (GOONG_API_KEY && GOONG_API_KEY !== 'YOUR_GOONG_API_KEY') {
      try {
        const url = `https://rsapi.goong.io/Direction?origin=${start}&destination=${end}&vehicle=car&api_key=${GOONG_API_KEY}&geometries=geojson&overview=full`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          // Goong Direction returns polylines, we need to normalize to OSRM format for the frontend if needed
          // or update frontend to handle both. OSRM structure: { routes: [ { geometry: ... } ] }
          if (data.routes && data.routes.length > 0) {
            // If Goong returns GeoJSON in the same structure, it works.
            // Actually Goong's Direction API is very similar to Google's.
            return res.status(200).json(data);
          }
        }
      } catch (e) {
        console.warn("Goong Direction failed:", e.message);
      }
    }

    // Fallback to OSRM
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start.replace(',', '.')};${end.replace(',', '.')}?overview=full&geometries=geojson`;
    const response = await fetch(osrmUrl);
    if (response.ok) {
      const data = await response.json();
      return res.status(200).json(data);
    }

    res.status(500).json({ success: false, message: "Không thể lấy dữ liệu chỉ đường" });
  } catch (error) {
    console.error("Lỗi routing:", error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

export const searchAddress = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: "Thiếu từ khóa tìm kiếm" });
    }

    const GOONG_API_KEY = process.env.GOONG_API_KEY;

    if (GOONG_API_KEY && GOONG_API_KEY !== 'YOUR_GOONG_API_KEY') {
      try {
        const response = await fetch(`https://rsapi.goong.io/Place/AutoComplete?api_key=${GOONG_API_KEY}&input=${encodeURIComponent(q)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.predictions && data.predictions.length > 0) {
            // Need to fetch details for each prediction to get lat/lng, or at least for the first one.
            // But usually Autocomplete returns enough. However, the frontend expects lat/lng.
            // So we might need to call Place Detail for each or return a modified list.
            
            // To be efficient, we'll return the predictions and let the frontend handle selection,
            // OR we can fetch details for all (limited to 5).
            const detailedResults = await Promise.all(data.predictions.slice(0, 5).map(async (p) => {
              const detailRes = await fetch(`https://rsapi.goong.io/Place/Detail?place_id=${p.place_id}&api_key=${GOONG_API_KEY}`);
              const detailData = await detailRes.json();
              if (detailData.result) {
                return {
                  display_name: p.description,
                  lat: detailData.result.geometry.location.lat,
                  lon: detailData.result.geometry.location.lng,
                  place_id: p.place_id
                };
              }
              return null;
            }));

            return res.status(200).json(detailedResults.filter(Boolean));
          }
        }
      } catch (e) {
        console.warn("Goong Search failed:", e.message);
      }
    }

    // Fallback to Nominatim
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`, {
      headers: { 'User-Agent': 'AetherMapApp/1.0' }
    });
    if (response.ok) {
      const data = await response.json();
      return res.status(200).json(data);
    }

    res.status(500).json({ success: false, message: "Tìm kiếm thất bại" });
  } catch (error) {
    console.error("Lỗi tìm kiếm:", error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
};

