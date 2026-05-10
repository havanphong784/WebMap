import {apiClient} from "../../../shared/api/apiClient.js";

export const getAddress = async (lat, lng) => {
  try {
    const result = await apiClient.get(`/locations/geocoding/reverse?lat=${lat}&lng=${lng}`);

    if (result?.success === false) {
      return {display_name: result.message || "Không xác định được địa chỉ"};
    }

    if (result?.display_name) {
      return {
        display_name: result.display_name
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
    const results = await apiClient.get(`/locations/geocoding/search?q=${encodeURIComponent(query)}`);
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error("Lỗi tìm kiếm:", error);
    return [];
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
