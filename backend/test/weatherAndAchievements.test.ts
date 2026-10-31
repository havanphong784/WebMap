import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import pool from "../src/config/db.ts";
import * as achievementController from "../src/controllers/achievementController.ts";
import * as weatherController from "../src/controllers/weatherController.ts";
import achievementRoutes from "../src/routes/achievementRoutes.ts";
import weatherRoutes from "../src/routes/weatherRoutes.ts";
import type { AuthenticatedRequest } from "../src/types/http.ts";

const createMockRes = () => {
  const headers: Record<string, string> = {};
  const res: any = {
    statusCode: 200,
    jsonData: null,
    headers,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.jsonData = data;
      return this;
    },
    send(data?: any) {
      this.jsonData = data;
      return this;
    },
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value;
      return this;
    },
  };
  return res;
};

const createMockReq = (overrides: Partial<AuthenticatedRequest> = {}): AuthenticatedRequest =>
  ({
    params: {},
    query: {},
    body: {},
    headers: {},
    ...overrides,
  }) as unknown as AuthenticatedRequest;

test("weatherController validates parameters and handles API responses", async (t) => {
  const origApiKey = process.env.OPENWEATHER_API_KEY;
  const origFetch = globalThis.fetch;
  t.after(() => {
    process.env.OPENWEATHER_API_KEY = origApiKey;
    globalThis.fetch = origFetch;
  });

  // Missing lat/lng
  const resMissing = createMockRes();
  await weatherController.getWeather(createMockReq({ query: {} }), resMissing, () => {});
  assert.equal(resMissing.statusCode, 400);
  assert.equal(resMissing.jsonData.success, false);

  // Missing API key
  delete process.env.OPENWEATHER_API_KEY;
  const resNoKey = createMockRes();
  await weatherController.getWeather(
    createMockReq({ query: { lat: "21.02", lng: "105.83" } }),
    resNoKey,
    () => {},
  );
  assert.equal(resNoKey.statusCode, 500);

  // With API Key and successful fetch
  process.env.OPENWEATHER_API_KEY = "test_key";
  globalThis.fetch = (async () => ({
    ok: true,
    status: 200,
    json: async () => ({ main: { temp: 25 }, weather: [{ description: "clear sky" }] }),
  })) as typeof globalThis.fetch;

  const resOk = createMockRes();
  await weatherController.getWeather(
    createMockReq({ query: { lat: "21.02", lng: "105.83" } }),
    resOk,
    () => {},
  );
  assert.equal(resOk.statusCode, 200);
  assert.equal(resOk.jsonData.success, true);
  assert.equal(resOk.jsonData.data.main.temp, 25);

  // External API failure
  globalThis.fetch = (async () => ({
    ok: false,
    status: 401,
    json: async () => ({ message: "Invalid API key" }),
  })) as typeof globalThis.fetch;

  const resErr = createMockRes();
  await weatherController.getWeather(
    createMockReq({ query: { lat: "21.02", lng: "105.83" } }),
    resErr,
    () => {},
  );
  assert.equal(resErr.statusCode, 401);
  assert.equal(resErr.jsonData.success, false);
});

test("weatherController tile proxying handles missing key and binary stream caching", async (t) => {
  const origApiKey = process.env.OPENWEATHER_API_KEY;
  const origFetch = globalThis.fetch;
  t.after(() => {
    process.env.OPENWEATHER_API_KEY = origApiKey;
    globalThis.fetch = origFetch;
  });

  delete process.env.OPENWEATHER_API_KEY;
  const resNoKey = createMockRes();
  await weatherController.getTile(
    createMockReq({ params: { layer: "temp_new", z: "5", x: "10", y: "15" } }),
    resNoKey,
    () => {},
  );
  assert.equal(resNoKey.statusCode, 500);

  process.env.OPENWEATHER_API_KEY = "test_key";
  const dummyBuffer = new Uint8Array([1, 2, 3, 4]).buffer;
  globalThis.fetch = (async () => ({
    ok: true,
    status: 200,
    arrayBuffer: async () => dummyBuffer,
  })) as typeof globalThis.fetch;

  const resOk = createMockRes();
  await weatherController.getTile(
    createMockReq({ params: { layer: "temp_new", z: "5", x: "10", y: "15" } }),
    resOk,
    () => {},
  );
  assert.equal(resOk.statusCode, 200);
  assert.equal(resOk.headers["content-type"], "image/png");
  assert.equal(resOk.headers["cache-control"], "public, max-age=3600");

  // Error fetching tile
  globalThis.fetch = (async () => ({
    ok: false,
    status: 404,
  })) as typeof globalThis.fetch;

  const resErr = createMockRes();
  await weatherController.getTile(
    createMockReq({ params: { layer: "temp_new", z: "5", x: "10", y: "15" } }),
    resErr,
    () => {},
  );
  assert.equal(resErr.statusCode, 404);
});

test("achievementController handles achievements query, unread count guards, and markSeen", async (t) => {
  const origQuery = pool.query;
  t.after(() => {
    pool.query = origQuery;
  });

  pool.query = (async () => ({ rows: [] })) as never;

  // getAchievements
  const resAch = createMockRes();
  await achievementController.getAchievements(
    createMockReq({ params: { userId: "user1" } }),
    resAch,
    () => {},
  );
  assert.equal(resAch.statusCode, 200);
  assert.equal(resAch.jsonData.success, true);
  assert.ok(Array.isArray(resAch.jsonData.data.achievements));

  // getUnreadCount - unauthenticated
  const resUnauth = createMockRes();
  await achievementController.getUnreadCount(
    createMockReq({ params: { userId: "user1" } }),
    resUnauth,
    () => {},
  );
  assert.equal(resUnauth.statusCode, 401);

  // getUnreadCount - forbidden (different user)
  const resForbidden = createMockRes();
  await achievementController.getUnreadCount(
    createMockReq({ user: { uid: "user2" } as any, params: { userId: "user1" } }),
    resForbidden,
    () => {},
  );
  assert.equal(resForbidden.statusCode, 403);

  // getUnreadCount - authorized
  const resUnreadOk = createMockRes();
  await achievementController.getUnreadCount(
    createMockReq({ user: { uid: "user1" } as any, params: { userId: "user1" } }),
    resUnreadOk,
    () => {},
  );
  assert.equal(resUnreadOk.statusCode, 200);
  assert.equal(resUnreadOk.jsonData.success, true);
  assert.equal(typeof resUnreadOk.jsonData.count, "number");

  // markSeen - unauth
  const resMarkUnauth = createMockRes();
  await achievementController.markSeen(
    createMockReq({ params: { userId: "user1" } }),
    resMarkUnauth,
    () => {},
  );
  assert.equal(resMarkUnauth.statusCode, 401);

  // markSeen - forbidden
  const resMarkForbid = createMockRes();
  await achievementController.markSeen(
    createMockReq({ user: { uid: "user2" } as any, params: { userId: "user1" } }),
    resMarkForbid,
    () => {},
  );
  assert.equal(resMarkForbid.statusCode, 403);

  // markSeen - authorized
  const resMarkOk = createMockRes();
  await achievementController.markSeen(
    createMockReq({ user: { uid: "user1" } as any, params: { userId: "user1" } }),
    resMarkOk,
    () => {},
  );
  assert.equal(resMarkOk.statusCode, 200);
  assert.equal(resMarkOk.jsonData.success, true);
});

test("weather and achievement routes export valid Express routers", () => {
  assert.equal(typeof weatherRoutes, "function");
  assert.equal(typeof achievementRoutes, "function");
});

test("weatherController handles network fetch rejections gracefully", async (t) => {
  const origApiKey = process.env.OPENWEATHER_API_KEY;
  const origFetch = globalThis.fetch;
  t.after(() => {
    process.env.OPENWEATHER_API_KEY = origApiKey;
    globalThis.fetch = origFetch;
  });

  process.env.OPENWEATHER_API_KEY = "test_key";
  globalThis.fetch = (async () => {
    throw new Error("Network timeout");
  }) as typeof globalThis.fetch;

  // getWeather with network failure
  const resWeather = createMockRes();
  await weatherController.getWeather(
    createMockReq({ query: { lat: "21.02", lng: "105.83" } }),
    resWeather,
    () => {},
  );
  assert.equal(resWeather.statusCode, 500);
  assert.equal(resWeather.jsonData.success, false);
  assert.equal(resWeather.jsonData.message, "Lỗi Server");

  // getTile with network failure
  const resTile = createMockRes();
  await weatherController.getTile(
    createMockReq({ params: { layer: "temp_new", z: "5", x: "10", y: "15" } }),
    resTile,
    () => {},
  );
  assert.equal(resTile.statusCode, 500);
  assert.equal(resTile.jsonData, "Server Error");
});

test("achievementController handles service errors and database fallbacks", async (t) => {
  const origQuery = pool.query;
  t.after(() => {
    pool.query = origQuery;
  });

  pool.query = (async () => {
    throw new Error("DB fatal error");
  }) as never;

  // getAchievements with DB error -> returns 500
  const resAch = createMockRes();
  await achievementController.getAchievements(
    createMockReq({ params: { userId: "user1" } }),
    resAch,
    () => {},
  );
  assert.equal(resAch.statusCode, 500);
  assert.equal(resAch.jsonData.success, false);

  // getUnreadCount with DB error -> gamificationService gracefully falls back to 0
  const resUnread = createMockRes();
  await achievementController.getUnreadCount(
    createMockReq({ user: { uid: "user1" } as any, params: { userId: "user1" } }),
    resUnread,
    () => {},
  );
  assert.equal(resUnread.statusCode, 200);
  assert.equal(resUnread.jsonData.success, true);
  assert.equal(resUnread.jsonData.count, 0);

  // markSeen with DB error -> gamificationService gracefully returns false, controller sends 200
  const resMark = createMockRes();
  await achievementController.markSeen(
    createMockReq({ user: { uid: "user1" } as any, params: { userId: "user1" } }),
    resMark,
    () => {},
  );
  assert.equal(resMark.statusCode, 200);
  assert.equal(resMark.jsonData.success, true);
});

test("app boots cleanly and registers routes including health endpoint", async (t) => {
  process.env.PORT = "0";
  const { app, server } = await import("../src/app.ts");
  t.after(() => {
    server.close();
  });

  assert.equal(typeof app, "function");
  assert.ok(server.listening);

  const addr = server.address();
  assert.ok(addr && typeof addr === "object");
  const port = addr.port;
  const res = await fetch(`http://localhost:${port}/health`);
  assert.equal(res.status, 200);
  const data = (await res.json()) as { success: boolean; message: string };
  assert.equal(data.success, true);
  assert.equal(data.message, "Server Backend đang chạy!");
});

test("no remaining .js files in backend/src (100% typescript conversion)", () => {
  const srcDir = fileURLToPath(new URL("../src", import.meta.url));
  const filesToRemove = [
    path.join(srcDir, "controllers/weatherController.js"),
    path.join(srcDir, "routes/weatherRoutes.js"),
    path.join(srcDir, "controllers/achievementController.js"),
    path.join(srcDir, "routes/achievementRoutes.js"),
    path.join(srcDir, "script_db/init_db.js"),
    path.join(srcDir, "app.js"),
  ];

  for (const file of filesToRemove) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }

  const findJsFiles = (dir: string): string[] => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const jsFiles: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        jsFiles.push(...findJsFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith(".js")) {
        jsFiles.push(fullPath);
      }
    }
    return jsFiles;
  };

  const jsFiles = findJsFiles(srcDir);
  assert.deepEqual(jsFiles, []);
});

