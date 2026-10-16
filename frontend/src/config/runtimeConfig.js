const DEFAULT_API_BASE_URL = "http://localhost:3000/api";

const read = (env, key) => {
  const value = env?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const requireReleaseValue = (env, key) => {
  const value = read(env, key);
  if (!value) {
    throw new Error(`Missing required Android release setting: ${key}`);
  }
  return value;
};

const validateReleaseUrl = (value, key) => {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${key} must be a valid HTTPS URL for Android release`);
  }

  const hostname = url.hostname.toLowerCase();
  const placeholder = hostname.endsWith(".example") || hostname.endsWith(".example.com")
    || hostname.includes("replace") || value.toLowerCase().includes("replace-me");
  if (url.protocol !== "https:" || hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || placeholder) {
    throw new Error(`${key} must use HTTPS and may not target localhost or a placeholder for Android release`);
  }
  return url.toString().replace(/\/$/, "");
};

export const getRuntimeConfig = (env, {release = false} = {}) => {
  const apiBaseUrl = release
    ? requireReleaseValue(env, "VITE_API_BASE_URL")
    : read(env, "VITE_API_BASE_URL") || DEFAULT_API_BASE_URL;

  if (release) validateReleaseUrl(apiBaseUrl, "VITE_API_BASE_URL");

  const publicWebUrl = release
    ? validateReleaseUrl(requireReleaseValue(env, "VITE_PUBLIC_WEB_URL"), "VITE_PUBLIC_WEB_URL")
    : read(env, "VITE_PUBLIC_WEB_URL") || globalThis.location?.origin;

  const releaseValue = (key) => release ? requireReleaseValue(env, key) : read(env, key);
  const firebaseConfig = {
    apiKey: releaseValue("VITE_FIREBASE_API_KEY"),
    authDomain: releaseValue("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: releaseValue("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: releaseValue("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: releaseValue("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: releaseValue("VITE_FIREBASE_APP_ID"),
    measurementId: read(env, "VITE_FIREBASE_MEASUREMENT_ID"),
  };

  const goongTilesKey = release
    ? requireReleaseValue(env, "VITE_GOONG_MAP_TILES_KEY")
    : read(env, "VITE_GOONG_MAP_TILES_KEY") || read(env, "VITE_GOONG_API_KEY");

  return {apiBaseUrl, publicWebUrl, firebaseConfig, goongTilesKey};
};

export const runtimeConfig = getRuntimeConfig(import.meta.env);
