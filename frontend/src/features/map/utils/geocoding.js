export const getAddress = async (lat, lng) => {
  try {
    const url = `https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const prop = data.features[0].properties;
      return {
        display_name: [prop.name, prop.street, prop.district, prop.city, prop.country]
          .filter(Boolean)
          .join(", ")
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
