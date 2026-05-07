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

const geocodingCache = new Map();
const MAX_CACHE_SIZE = 1000;

export const getLocations = async (req, res) => {
  try {
    const {user_id, minLng, maxLng, minLat, maxLat} = req.query;

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
    res.status(200).json({success: true, data});
  } catch (error) {
    console.error("Lỗi lấy danh sách địa điểm:", error);
    res.status(500).json({success: false, message: "Lỗi Server", detail: error.message});
  }
};

export const createLocationEntry = async (req, res) => {
  try {
    const {tags, ...rest} = req.body;
    const normalizedTags = Array.isArray(tags)
      ? tags.map(t => t.trim().toLowerCase()).filter(Boolean)
      : [];
    const saved = await createLocation({...rest, tags: normalizedTags});

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

      // Notify followers
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

    res.status(201).json({success: true, data: saved});
  } catch (error) {
    console.error("Lỗi khi lưu địa điểm:", error);
    res.status(500).json({success: false, message: "Lỗi Server"});
  }
};

export const getUserLocations = async (req, res) => {
  try {
    const {uid} = req.params;
    const {current_user_id} = req.query;
    const data = await listUserLocations({uid, currentUserId: current_user_id});
    res.status(200).json({success: true, data});
  } catch (error) {
    console.error("Lỗi lấy địa điểm theo User:", error);
    res.status(500).json({success: false, message: "Lỗi Server"});
  }
};

export const getTrendingLocations = async (req, res) => {
  try {
    const {user_id} = req.query;
    const data = await listTrendingLocations({userId: user_id});
    res.status(200).json({success: true, data});
  } catch (error) {
    console.error("Lỗi lấy địa điểm xu hướng:", error);
    res.status(500).json({success: false, message: "Lỗi Server"});
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
    const {id} = req.params;
    const {user_id} = req.body;
    const deleted = await deleteLocation({locationId: id, userId: user_id});
    res.status(200).json({success: true, data: deleted});
  } catch (error) {
    console.error("Lỗi xóa địa điểm:", error);
    res.status(403).json({success: false, message: error.message || "Lỗi Server"});
  }
};

export const getLocationById = async (req, res) => {
  try {
    const {id} = req.params;
    const {user_id} = req.query;
    const data = await getLocationDetail({locationId: id, userId: user_id});
    if (!data) {
      return res.status(404).json({success: false, message: "Không tìm thấy địa điểm"});
    }
    res.status(200).json({success: true, data});
  } catch (error) {
    console.error("Lỗi lấy chi tiết địa điểm:", error);
    res.status(500).json({success: false, message: "Lỗi Server"});
  }
};

export const getLocationsByTag = async (req, res) => {
  try {
    const {tag} = req.params;
    const {user_id} = req.query;
    const data = await listLocationsByTag({tag, userId: user_id});
    res.status(200).json({success: true, data});
  } catch (error) {
    console.error("Lỗi lọc địa điểm theo tag:", error);
    res.status(500).json({success: false, message: "Lỗi Server"});
  }
};

export const getUniqueTags = async (req, res) => {
  try {
    const data = await listUniqueTags();
    res.status(200).json({success: true, data});
  } catch (error) {
    console.error("Lỗi lấy danh sách tag:", error);
    res.status(500).json({success: false, message: "Lỗi Server"});
  }
};

export const reverseGeocode = async (req, res) => {
  const {lat, lng} = req.query;
  if (!lat || !lng) {
    return res.status(400).json({success: false, message: "Thiếu tọa độ"});
  }

  const cacheKey = `${parseFloat(lat).toFixed(5)},${parseFloat(lng).toFixed(5)}`;
  if (geocodingCache.has(cacheKey)) {
    return res.status(200).json(geocodingCache.get(cacheKey));
  }

  // Helper function for timeout
  const fetchWithTimeout = async (url, options, timeout = 3000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
  };

  try {
    // Priority 1: Nominatim (OSM)
    try {
      const response = await fetchWithTimeout(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: {
          'User-Agent': 'AetherMapApp/1.0 (contact: havanphong784@gmail.com)',
          'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8'
        }
      }, 3000);

      if (response.ok) {
        const data = await response.json();
        if (data && !data.error) {
          if (geocodingCache.size >= MAX_CACHE_SIZE) {
            const firstKey = geocodingCache.keys().next().value;
            geocodingCache.delete(firstKey);
          }
          geocodingCache.set(cacheKey, data);
          return res.status(200).json(data);
        }
      }
    } catch (nominatimError) {
      console.warn("Nominatim failed, trying fallback...", nominatimError.message);
    }

    // Priority 2: BigDataCloud (Fast & Reliable Fallback)
    const fallbackResponse = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=vi`);
    
    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json();
      const normalizedData = {
        display_name: fallbackData.locality || fallbackData.city || fallbackData.principalSubdivision || "Địa điểm không xác định",
        address: {
          city: fallbackData.city,
          country: fallbackData.countryName,
          postcode: fallbackData.postcode
        },
        fallback: true
      };

      if (geocodingCache.size >= MAX_CACHE_SIZE) {
        const firstKey = geocodingCache.keys().next().value;
        geocodingCache.delete(firstKey);
      }
      geocodingCache.set(cacheKey, normalizedData);
      return res.status(200).json(normalizedData);
    }

    res.status(500).json({success: false, message: "Tất cả dịch vụ định vị đều gặp lỗi"});
  } catch (error) {
    console.error("Lỗi hoàn toàn hệ thống geocoding:", error);
    res.status(500).json({success: false, message: "Lỗi Server"});
  }
};

export const getDirections = async (req, res) => {
  try {
    const {start, end} = req.query;
    if (!start || !end) {
      return res.status(400).json({success: false, message: "Thiếu tọa độ bắt đầu hoặc kết thúc"});
    }

    const fetchWithTimeout = async (url, options, timeout = 5000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (e) {
        clearTimeout(id);
        throw e;
      }
    };

    // Priority 1: OSRM Main
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`;
      const response = await fetchWithTimeout(url, {
        headers: { 'User-Agent': 'AetherMapApp/1.0' }
      }, 5000);

      if (response.ok) {
        const data = await response.json();
        return res.status(200).json(data);
      }
    } catch (osrmError) {
      console.warn("OSM Routing failed, trying fallback...", osrmError.message);
    }

    // Priority 2: OSM.de (Reliable Fallback)
    const fallbackUrl = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${start};${end}?overview=full&geometries=geojson`;
    const fallbackResponse = await fetch(fallbackUrl);
    
    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json();
      return res.status(200).json(fallbackData);
    }

    res.status(500).json({success: false, message: "Không thể lấy dữ liệu chỉ đường từ tất cả các nguồn"});
  } catch (error) {
    console.error("Lỗi hoàn toàn hệ thống routing:", error);
    res.status(500).json({success: false, message: "Lỗi Server"});
  }
};

export const searchAddress = async (req, res) => {
  try {
    const {q} = req.query;
    if (!q) {
      return res.status(400).json({success: false, message: "Thiếu từ khóa tìm kiếm"});
    }

    const fetchWithTimeout = async (url, options, timeout = 4000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (e) {
        clearTimeout(id);
        throw e;
      }
    };

    // Priority 1: Nominatim
    try {
      const response = await fetchWithTimeout(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`, {
        headers: {
          'User-Agent': 'AetherMapApp/1.0',
          'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8'
        }
      }, 4000);

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          return res.status(200).json(data);
        }
      }
    } catch (nominatimError) {
      console.warn("Search Nominatim failed, trying fallback...", nominatimError.message);
    }

    // Priority 2: Photon (Fast Geocoding API)
    const fallbackResponse = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lang=vi`);
    
    if (fallbackResponse.ok) {
      const fallbackData = await fallbackResponse.json();
      // Normalize Photon format to match Nominatim (approximately)
      const normalizedData = fallbackData.features.map(f => ({
        display_name: `${f.properties.name || ''} ${f.properties.street || ''} ${f.properties.city || ''} ${f.properties.country || ''}`.trim(),
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
        type: f.properties.osm_value
      }));
      return res.status(200).json(normalizedData);
    }

    res.status(500).json({success: false, message: "Tìm kiếm thất bại ở tất cả các nguồn"});
  } catch (error) {
    console.error("Lỗi hoàn toàn hệ thống tìm kiếm:", error);
    res.status(500).json({success: false, message: "Lỗi Server"});
  }
};

