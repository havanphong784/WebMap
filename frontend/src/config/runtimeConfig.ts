const DEFAULT_API_BASE_URL = "http://localhost:3000/api";

export interface FirebaseRuntimeConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

export interface RuntimeConfig {
  apiBaseUrl: string;
  publicWebUrl?: string;
  firebaseConfig: FirebaseRuntimeConfig;
  goongTilesKey?: string;
}

export interface RuntimeConfigOptions {
  release?: boolean;
}

const read = (env: Record<string, unknown> | undefined, key: string): string | undefined => {
  const value = env?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const requireReleaseValue = (env: Record<string, unknown> | undefined, key: string): string => {
  const value = read(env, key);
  if (!value) {
    throw new Error(`Missing required Android release setting: ${key}`);
  }
  return value;
};

const validateReleaseUrl = (value: string, key: string): string => {
  let url: URL;
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

export const getRuntimeConfig = (
  env?: Record<string, unknown>,
  {release = false}: RuntimeConfigOptions = {}
): RuntimeConfig => {
  const apiBaseUrl = release
    ? requireReleaseValue(env, "VITE_API_BASE_URL")
    : read(env, "VITE_API_BASE_URL") || DEFAULT_API_BASE_URL;

  if (release) validateReleaseUrl(apiBaseUrl, "VITE_API_BASE_URL");

  const publicWebUrl = release
    ? validateReleaseUrl(requireReleaseValue(env, "VITE_PUBLIC_WEB_URL"), "VITE_PUBLIC_WEB_URL")
    : read(env, "VITE_PUBLIC_WEB_URL") || globalThis.location?.origin;

  const releaseValue = (key: string): string | undefined => release ? requireReleaseValue(env, key) : read(env, key);
  const firebaseConfig: FirebaseRuntimeConfig = {
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

export const runtimeConfig: RuntimeConfig = getRuntimeConfig(
  (import.meta as unknown as {env?: Record<string, unknown>})?.env
);
