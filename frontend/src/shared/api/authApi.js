import { API_BASE_URL } from "./apiClient.js";

export const syncUserWithBackend = async (firebaseUser) => {
  try {
    const token = await firebaseUser.getIdToken();

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Không thể đồng bộ User với Backend");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Lỗi gọi API Auth:", error);
    throw error;
  }
};

