import { auth } from "../../config/firebase.js";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const getHeaders = async (includeAuth = true) => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (includeAuth && auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers["Authorization"] = `Bearer ${token}`;
    } catch (error) {
      console.error("Lỗi lấy token:", error);
    }
  }

  return headers;
};

export const apiClient = {
  get: async (endpoint) => {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
    return await response.json();
  },
  post: async (endpoint, data) => {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    });
    return await response.json();
  },
  delete: async (endpoint, data) => {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers,
      body: JSON.stringify(data)
    });
    return await response.json();
  },
  put: async (endpoint, data) => {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(data)
    });
    return await response.json();
  }
};
