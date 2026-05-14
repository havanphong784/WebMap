import {apiClient} from "../../../shared/api/apiClient.js";

const unwrap = (response) => {
  if (!response) return null;
  if (response.success === false) return null;
  // Hỗ trợ cả response có wrapper {success, data} và shape cũ trả thẳng object.
  return response.data ?? response;
};

export const getAddress = async (lat, lng) => {
  try {
    const result = await apiClient.get(`/locations/geocoding/reverse?lat=${lat}&lng=${lng}`);
    if (result?.success === false) {
      return {display_name: result.message || "Không xác định được địa chỉ"};
    }

    const payload = unwrap(result);
    if (payload?.display_name || payload?.formatted_address) {
      return {
        ...payload,
        display_name: payload.display_name || payload.formatted_address,
      };
    }

    return {display_name: "Không xác định được địa chỉ"};
  } catch (error) {
    console.error("Lỗi lấy địa chỉ:", error);
    return {display_name: "Lỗi kết nối địa chỉ"};
  }
};

export const searchAddress = async (query) => {
  try {
    const response = await apiClient.get(`/locations/geocoding/search?q=${encodeURIComponent(query)}`);
    const payload = unwrap(response);
    return Array.isArray(payload) ? payload : [];
  } catch (error) {
    console.error("Lỗi tìm kiếm:", error);
    return [];
  }
};

export const getPlaceDetail = async (placeId) => {
  if (!placeId) return null;
  try {
    const result = await apiClient.get(`/locations/goong/place-detail?place_id=${encodeURIComponent(placeId)}`);
    return unwrap(result);
  } catch (error) {
    console.error("Lỗi lấy chi tiết địa điểm Goong:", error);
    return null;
  }
};

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
