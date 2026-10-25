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
    expect(cn()).toBe("");
  });

  it("isMobile detects screen width and user agent", () => {
    const originalWidth = window.innerWidth;
    window.innerWidth = 500;
    expect(isMobile()).toBe(true);

    window.innerWidth = 1024;
    expect(isMobile()).toBe(false);
    window.innerWidth = originalWidth;
  });

  it("parseDBDate and formatFullTime normalize and format dates", () => {
    const parsed = parseDBDate("2026-10-25 08:30:00");
    expect(parsed).toBeInstanceOf(Date);
    expect(parseDBDate(null)).toBeInstanceOf(Date);

    const formatted = formatFullTime("2026-10-25T08:30:00Z");
    expect(formatted).toContain("2026");
    expect(formatted).toContain("25/10");
  });

  it("compressImage returns webp File", async () => {
    const dummyFile = new File(["test-image"], "photo.png", {type: "image/png"});
    const compressed = await compressImage(dummyFile);
    expect(compressed.name).toBe("photo.webp");
    expect(compressed.type).toBe("image/webp");
  });

  describe("apiClient", () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it("performs get request and parses json payload", async () => {
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
    });

    it("normalizes HTTP error response", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({"content-type": "application/json"}),
        json: async () => ({success: false, error: {code: "NOT_FOUND", message: "Resource missing"}}),
      });

      const res = await apiClient.post("/not-found", {foo: "bar"});
      expect(res.success).toBe(false);
      expect(res.status).toBe(404);
      expect(res.error.code).toBe("NOT_FOUND");
    });
  });
});

describe("shared hooks", () => {
  it("useWindowSize tracks window dimensions", async () => {
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
    await act(async () => {
      root.unmount();
    });
  });

  it("useSSE mounts and cleans up connection when disabled", async () => {
    function TestComponent() {
      useSSE({enabled: false, handlers: {}});
      return null;
    }

    const container = document.createElement("div");
    const root = createRoot(container);
    await act(async () => {
      root.render(createElement(TestComponent));
    });
    await act(async () => {
      root.unmount();
    });
  });
});
