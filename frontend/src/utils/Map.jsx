export const getAddress = async (x, y) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${x}&lon=${y}&zoom=18&addressdetails=1`);
    const result = await response.json();
    console.log(result);
    return result;
  } catch (err) {
    console.log(err);
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