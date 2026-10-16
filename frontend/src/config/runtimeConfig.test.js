import {describe, expect, it} from "vitest";
import {getRuntimeConfig} from "./runtimeConfig.js";

const completeEnv = (overrides = {}) => ({
  VITE_API_BASE_URL: "https://api.aether.example/api",
  VITE_FIREBASE_API_KEY: "firebase-api-key",
  VITE_FIREBASE_AUTH_DOMAIN: "aether.firebaseapp.com",
  VITE_FIREBASE_PROJECT_ID: "aether-project",
  VITE_FIREBASE_STORAGE_BUCKET: "aether.firebasestorage.app",
  VITE_FIREBASE_MESSAGING_SENDER_ID: "123456789",
  VITE_FIREBASE_APP_ID: "1:123456789:web:abc123",
  VITE_GOONG_MAP_TILES_KEY: "goong-tiles-key",
  ...overrides,
});

describe("getRuntimeConfig", () => {
  it("accepts an explicit localhost API during development", () => {
    const config = getRuntimeConfig(completeEnv({
      VITE_API_BASE_URL: "http://localhost:3000/api",
    }), {release: false});

    expect(config.apiBaseUrl).toBe("http://localhost:3000/api");
  });

  it("returns normalized Android release configuration", () => {
    const config = getRuntimeConfig(completeEnv(), {release: true});

    expect(config).toEqual({
      apiBaseUrl: "https://api.aether.example/api",
      firebaseConfig: {
        apiKey: "firebase-api-key",
        authDomain: "aether.firebaseapp.com",
        projectId: "aether-project",
        storageBucket: "aether.firebasestorage.app",
        messagingSenderId: "123456789",
        appId: "1:123456789:web:abc123",
        measurementId: undefined,
      },
      goongTilesKey: "goong-tiles-key",
    });
  });

  it.each([
    ["missing", undefined],
    ["cleartext", "http://api.aether.example/api"],
    ["localhost", "https://localhost:3000/api"],
    ["loopback", "https://127.0.0.1:3000/api"],
  ])("rejects a %s release API URL", (_label, apiBaseUrl) => {
    expect(() => getRuntimeConfig(completeEnv({
      VITE_API_BASE_URL: apiBaseUrl,
    }), {release: true})).toThrow(/VITE_API_BASE_URL/);
  });

  it.each([
    "VITE_FIREBASE_API_KEY",
    "VITE_FIREBASE_AUTH_DOMAIN",
    "VITE_FIREBASE_PROJECT_ID",
    "VITE_FIREBASE_STORAGE_BUCKET",
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    "VITE_FIREBASE_APP_ID",
    "VITE_GOONG_MAP_TILES_KEY",
  ])("rejects release configuration missing %s", (key) => {
    expect(() => getRuntimeConfig(completeEnv({[key]: ""}), {release: true}))
      .toThrow(new RegExp(key));
  });
});
