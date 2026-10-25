import {auth} from "../../config/firebase.js";
import {runtimeConfig} from "../../config/runtimeConfig.js";

export const API_BASE_URL: string = runtimeConfig.apiBaseUrl;

const DEFAULT_TIMEOUT = 15000;

export interface ApiErrorDetail {
  code: string;
  message: string;
  status: number;
  details: unknown;
}

export interface ApiErrorResult {
  success: false;
  status: number;
  message: string;
  error: ApiErrorDetail;
}

export interface RequestOptions {
  method?: string;
  data?: unknown;
  includeAuth?: boolean;
  timeout?: number;
}

const getHeaders = async (includeAuth = true): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
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

const normalizeError = (payload: any, status: number, fallbackMessage: string): ApiErrorResult => {
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

const parseResponse = async (response: Response): Promise<any> => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text ? {message: text} : {};
};

const request = async <T = any>(
  endpoint: string,
  {method = "GET", data, includeAuth = true, timeout = DEFAULT_TIMEOUT}: RequestOptions = {}
): Promise<T> => {
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
      return normalizeError(payload, response.status, "Không thể kết nối tới máy chủ") as unknown as T;
    }

    return payload as T;
  } catch (error: any) {
    const message = error?.name === "AbortError"
      ? "Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại."
      : error?.message || "Lỗi kết nối mạng";

    return normalizeError({message, code: "NETWORK_ERROR"}, 0, message) as unknown as T;
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
};

export interface ApiClient {
  get: <T = any>(endpoint: string, options?: Omit<RequestOptions, "method" | "data">) => Promise<T>;
  post: <T = any>(endpoint: string, data?: unknown, options?: Omit<RequestOptions, "method" | "data">) => Promise<T>;
  put: <T = any>(endpoint: string, data?: unknown, options?: Omit<RequestOptions, "method" | "data">) => Promise<T>;
  delete: <T = any>(endpoint: string, options?: Omit<RequestOptions, "method" | "data">) => Promise<T>;
  API_BASE_URL: string;
}

export const apiClient: ApiClient = {
  get: (endpoint, options) => request(endpoint, {...options, method: "GET"}),
  post: (endpoint, data, options) => request(endpoint, {...options, method: "POST", data}),
  put: (endpoint, data, options) => request(endpoint, {...options, method: "PUT", data}),
  // DELETE không nên có body — dùng query string nếu cần thêm params.
  delete: (endpoint, options) => request(endpoint, {...options, method: "DELETE"}),
  API_BASE_URL,
};
