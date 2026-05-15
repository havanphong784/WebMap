import {apiClient} from "../../../shared/api/apiClient.js";

/**
 * Geocoding Cache & Debouncing Utilities
 * 
 * Improves performance by:
 * 1. Caching reverse geocode results (lat,lng → address)
 * 2. Debouncing rapid API calls
 * 3. Implementing retry logic with exponential backoff
 */

// Cache configuration
const CACHE_TTL = 3600000; // 1 hour
const MAX_CACHE_SIZE = 100;
const DEBOUNCE_DELAY = 300; // ms

// Reverse geocode cache: key = "lat,lng" → {data, timestamp}
const reverseGeocodeCache = new Map();

// Debounce timers: key = "lat,lng" → timeoutId
const debounceTimers = new Map();

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

/**
 * Generate cache key from coordinates
 */
const makeCacheKey = (lat, lng) => {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
};

/**
 * Check if cached data is still valid
 */
const isCacheValid = (timestamp) => {
  return Date.now() - timestamp < CACHE_TTL;
};

/**
 * Manage cache size (FIFO eviction)
 */
const putInCache = (key, data) => {
  reverseGeocodeCache.set(key, {data, timestamp: Date.now()});
  if (reverseGeocodeCache.size > MAX_CACHE_SIZE) {
    const firstKey = reverseGeocodeCache.keys().next().value;
    reverseGeocodeCache.delete(firstKey);
  }
};

/**
 * Retry logic with exponential backoff
 */
const retryAsync = async (fn, maxRetries = MAX_RETRIES, delay = RETRY_DELAY) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < maxRetries - 1) {
        const backoffDelay = delay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  throw lastError;
};

/**
 * Unwrap API response
 */
const unwrap = (response) => {
  if (!response) return null;
  if (response.success === false) return null;
  return response.data ?? response;
};

/**
 * Get address with caching and debouncing
 * 
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Address object with display_name
 */
export const getAddress = async (lat, lng) => {
  const cacheKey = makeCacheKey(lat, lng);
  
  // Check cache first
  const cached = reverseGeocodeCache.get(cacheKey);
  if (cached && isCacheValid(cached.timestamp)) {
    console.log("📍 Using cached address for", cacheKey);
    return cached.data;
  }
  
  // Return a promise that will be resolved after debounce delay
  return new Promise((resolve) => {
    // Clear existing debounce timer for this location
    if (debounceTimers.has(cacheKey)) {
      clearTimeout(debounceTimers.get(cacheKey));
    }
    
    // Set new debounce timer
    const timerId = setTimeout(async () => {
      debounceTimers.delete(cacheKey);
      
      try {
        const result = await retryAsync(async () => {
          return await apiClient.get(`/locations/geocoding/reverse?lat=${lat}&lng=${lng}`);
        });
        
        if (result?.success === false) {
          const errorResult = {display_name: result.message || "Không xác định được địa chỉ"};
          putInCache(cacheKey, errorResult);
          resolve(errorResult);
          return;
        }

        const payload = unwrap(result);
        if (payload?.display_name || payload?.formatted_address) {
          const addressData = {
            ...payload,
            display_name: payload.display_name || payload.formatted_address,
          };
          putInCache(cacheKey, addressData);
          resolve(addressData);
          return;
        }

        const fallback = {display_name: "Không xác định được địa chỉ"};
        putInCache(cacheKey, fallback);
        resolve(fallback);
      } catch (error) {
        console.error("Lỗi lấy địa chỉ:", error);
        const errorResult = {display_name: "Lỗi kết nối địa chỉ"};
        putInCache(cacheKey, errorResult);
        resolve(errorResult);
      }
    }, DEBOUNCE_DELAY);
    
    debounceTimers.set(cacheKey, timerId);
  });
};

/**
 * Search address with retry logic
 */
export const searchAddress = async (query) => {
  try {
    const response = await retryAsync(async () => {
      return await apiClient.get(`/locations/geocoding/search?q=${encodeURIComponent(query)}`);
    });
    const payload = unwrap(response);
    return Array.isArray(payload) ? payload : [];
  } catch (error) {
    console.error("Lỗi tìm kiếm:", error);
    return [];
  }
};

/**
 * Get place detail with retry logic
 */
export const getPlaceDetail = async (placeId) => {
  if (!placeId) return null;
  try {
    const result = await retryAsync(async () => {
      return await apiClient.get(`/locations/goong/place-detail?place_id=${encodeURIComponent(placeId)}`);
    });
    return unwrap(result);
  } catch (error) {
    console.error("Lỗi lấy chi tiết địa điểm Goong:", error);
    return null;
  }
};

/**
 * Get current position
 */
export const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Trình duyệt không hỗ trợ định vị"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lng: pos.coords.longitude,
        lat: pos.coords.latitude
      }),
      reject
    );
  });

/**
 * Clear all caches (useful for testing or manual refresh)
 */
export const clearGeocodeCache = () => {
  reverseGeocodeCache.clear();
  debounceTimers.forEach(timerId => clearTimeout(timerId));
  debounceTimers.clear();
  console.log("🗑️ Geocode cache cleared");
};
