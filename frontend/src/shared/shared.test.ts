import {act, createElement} from "react";
import {createRoot} from "react-dom/client";
import {afterEach, describe, expect, it, vi} from "vitest";
import {cn} from "./utils/classNames";
import {isMobile} from "./utils/deviceUtils";
import {formatFullTime, parseDBDate} from "./utils/dateUtils";
import {compressImage} from "./utils/imageUtils";
import {apiClient} from "./api/apiClient";
import useWindowSize from "./hooks/useWindowSize";
import useSSE from "./hooks/useSSE";

vi.mock("../config/firebase.js", () => ({auth: {currentUser: null}, googleProvider: {}}));

vi.mock("browser-image-compression", () => ({
  default: vi.fn(async (file: File) => new Blob([file], {type: "image/webp"})),
}));

describe("shared utils and apiClient", () => {
  it("cn filters falsy classes and joins values", () => {
    expect(cn("btn", false && "hidden", null, undefined, "btn-primary")).toBe("btn btn-primary");
    expect(cn("flex", 0, "items-center", true && "justify-between")).toBe("flex items-center justify-between");
    expect(cn()).toBe("");
  });

  it("isMobile detects screen width and user agent", () => {
    const originalWidth = window.innerWidth;
    const originalUserAgent = navigator.userAgent;

    window.innerWidth = 500;
    expect(isMobile()).toBe(true);

    window.innerWidth = 1024;
    expect(isMobile()).toBe(false);

    Object.defineProperty(navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
      configurable: true,
    });
    expect(isMobile()).toBe(true);

    Object.defineProperty(navigator, "userAgent", {value: originalUserAgent, configurable: true});
    window.innerWidth = originalWidth;
  });

  it("parseDBDate and formatFullTime normalize and format dates", () => {
    expect(parseDBDate("2026-10-25 08:30:00")).toBeInstanceOf(Date);
    expect(parseDBDate(null)).toBeInstanceOf(Date);

    const dateObj = new Date("2026-10-25T08:30:00Z");
    expect(parseDBDate(dateObj)).toBe(dateObj);

    const invalidParsed = parseDBDate("not-a-valid-date");
    expect(invalidParsed).toBeInstanceOf(Date);
    expect(isNaN(invalidParsed.getTime())).toBe(false);

    expect(parseDBDate("2026-10-25T08:30:00+07:00")).toBeInstanceOf(Date);

    const formatted = formatFullTime("2026-10-25T08:30:00Z");
    expect(formatted).toContain("2026");
    expect(formatted).toContain("25/10");
  });

  it("compressImage returns webp File and falls back on error", async () => {
    const dummyFile = new File(["test-image"], "photo.png", {type: "image/png"});
    const compressed = await compressImage(dummyFile);
    expect(compressed.name).toBe("photo.webp");
    expect(compressed.type).toBe("image/webp");

    const fileWithoutExt = new File(["test-data"], "rawfile", {type: "image/png"});
    const compressedNoExt = await compressImage(fileWithoutExt);
    expect(compressedNoExt.name).toBe("rawfile.webp");

    const imageCompression = (await import("browser-image-compression")).default;
    vi.mocked(imageCompression).mockRejectedValueOnce(new Error("Compression failure"));
    const fallback = await compressImage(dummyFile);
    expect(fallback).toBe(dummyFile);
  });

  describe("apiClient", () => {
    const originalFetch = globalThis.fetch;
    afterEach(() => { globalThis.fetch = originalFetch; });

    it("performs get, put, delete requests and parses payloads", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({"content-type": "application/json"}),
        json: async () => ({success: true, data: {count: 42}}),
      });

      const res = await apiClient.get("/test-endpoint");
      expect(res).toEqual({success: true, data: {count: 42}});
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test-endpoint"),
        expect.objectContaining({method: "GET"})
      );

      await apiClient.put("/items/1", {name: "Updated"});
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/items/1"),
        expect.objectContaining({method: "PUT", body: JSON.stringify({name: "Updated"})})
      );

      await apiClient.delete("/items/1");
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/items/1"),
        expect.objectContaining({method: "DELETE"})
      );
    });

    it("normalizes HTTP, non-JSON, network, and timeout errors", async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({"content-type": "application/json"}),
        json: async () => ({success: false, error: {code: "NOT_FOUND", message: "Resource missing"}}),
      });
      const notFound = await apiClient.post("/not-found", {foo: "bar"});
      expect(notFound.status).toBe(404);
      expect(notFound.error.code).toBe("NOT_FOUND");

      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 502,
        headers: new Headers({"content-type": "text/html"}),
        text: async () => "Bad Gateway",
      });
      const badGateway = await apiClient.get("/bad-gateway");
      expect(badGateway.status).toBe(502);
      expect(badGateway.message).toBe("Bad Gateway");

      globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error("Failed to fetch"));
      const netError = await apiClient.get("/net-fail");
      expect(netError.status).toBe(0);
      expect(netError.error.code).toBe("NETWORK_ERROR");

      const abortError = new Error("Abort");
      abortError.name = "AbortError";
      globalThis.fetch = vi.fn().mockRejectedValueOnce(abortError);
      const abortRes = await apiClient.get("/timeout-fail");
      expect(abortRes.message).toContain("Yêu cầu mất quá nhiều thời gian");
    });
  });
});

describe("shared hooks", () => {
  it("useWindowSize tracks dimensions and updates on debounced resize", async () => {
    vi.useFakeTimers();
    let size: any;
    function TestComponent() {
      size = useWindowSize();
      return null;
    }

    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(createElement(TestComponent));
    });

    expect(size).toHaveProperty("width");
    expect(size).toHaveProperty("height");

    window.innerWidth = 800;
    window.innerHeight = 600;
    window.dispatchEvent(new Event("resize"));
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(size.width).toBe(800);
    expect(size.height).toBe(600);

    await act(async () => {
      root.unmount();
    });
    vi.useRealTimers();
  });

  it("useSSE mounts and handles disabled and unauthenticated states", async () => {
    function DisabledComponent() {
      useSSE({enabled: false, handlers: {}});
      return null;
    }

    function EnabledNoAuthComponent() {
      useSSE({enabled: true, handlers: {}});
      return null;
    }

    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(createElement(DisabledComponent));
    });
    await act(async () => {
      root.render(createElement(EnabledNoAuthComponent));
    });
    await act(async () => {
      root.unmount();
    });
  });
});
