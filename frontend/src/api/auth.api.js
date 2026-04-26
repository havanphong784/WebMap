const BASE_URL = "http://localhost:3000/api";

export const syncUserWithBackend = async (firebaseUser) => {
  try {
    const token = await firebaseUser.getIdToken();

    const response = await fetch(`${BASE_URL}/auth/login`, {
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
