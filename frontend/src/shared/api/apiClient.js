import {auth} from "../../config/firebase.js";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const DEFAULT_TIMEOUT = 15000;

const getHeaders = async (includeAuth = true) => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (includeAuth && auth.currentUser) {
    try {
      const token = await auth.currentUser.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    } catch (error) {
      console.error("Lỗi lấy token:", error);
    }
  }

  return headers;
};

const normalizeError = (payload, status, fallbackMessage) => {
  const errorPayload = payload?.error && typeof payload.error === "object"
    ? payload.error
    : null;
  const message = errorPayload?.message || payload?.message || payload?.error || fallbackMessage;

  return {
    success: false,
    status,
    message,
    error: {
      code: errorPayload?.code || payload?.code || "REQUEST_FAILED",
      message,
      status,
      details: errorPayload?.details || payload?.details || null,
    },
  };
};

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? {message: text} : {};
};

const request = async (endpoint, {method = "GET", data, includeAuth = true, timeout = DEFAULT_TIMEOUT} = {}) => {
  const headers = await getHeaders(includeAuth);
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      signal: controller.signal,
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    const payload = await parseResponse(response);

    if (!response.ok || payload?.success === false) {
      return normalizeError(payload, response.status, "Không thể kết nối tới máy chủ");
    }

    return payload;
  } catch (error) {
    const message = error.name === "AbortError"
      ? "Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại."
      : error.message || "Lỗi kết nối mạng";

    return normalizeError({message, code: "NETWORK_ERROR"}, 0, message);
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
};

export const apiClient = {
  get: (endpoint, options) => request(endpoint, {...options, method: "GET"}),
  post: (endpoint, data, options) => request(endpoint, {...options, method: "POST", data}),
  put: (endpoint, data, options) => request(endpoint, {...options, method: "PUT", data}),
  // DELETE không nên có body — dùng query string nếu cần thêm params.
  delete: (endpoint, options) => request(endpoint, {...options, method: "DELETE"}),
  API_BASE_URL,
};
