import { apiClient } from "../../../shared/api/apiClient.js";

export const getAddress = async (lat, lng) => {
  try {
    const result = await apiClient.get(`/locations/geocoding/reverse?lat=${lat}&lng=${lng}`);
    return result;
  } catch (err) {
    console.error("Lỗi lấy địa chỉ qua proxy:", err);
    return null;
  }
}

export const searchAddress = async (query) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
    const results = await response.json();
    return results;
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
