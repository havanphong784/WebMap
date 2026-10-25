import {describe, expect, it, vi} from "vitest";
import {buildLocationShareUrl, createActionsAdapter} from "./actions.js";

describe("platform actions", () => {
  it("builds native share links from the public web origin", () => {
    expect(buildLocationShareUrl("https://aether.vn", {
      lat: 10.75,
      lng: 106.67,
      locationId: "place 1",
    })).toBe("https://aether.vn/?lat=10.75&lng=106.67&locationId=place+1");
    expect(buildLocationShareUrl("https://aether.vn", {
      lat: 0,
      lng: 0,
      locationId: "",
    })).toBe("https://aether.vn/?lat=0&lng=0");
  });
  it("uses native share, clipboard, and browser on Android", async () => {
    const share = {share: vi.fn().mockResolvedValue({activityType: "messages"})};
    const clipboard = {write: vi.fn()};
    const browser = {open: vi.fn()};
    const actions = createActionsAdapter({nativeAndroid: true, share, clipboard, browser});

    await expect(actions.shareContent({title: "Aether", url: "https://aether.example"})).resolves.toBe("shared");
    await actions.copyText("tọa độ");
    await actions.openExternalUrl("https://maps.goong.io/?lat=10&lng=106");

    expect(share.share).toHaveBeenCalledWith({title: "Aether", url: "https://aether.example"});
    expect(clipboard.write).toHaveBeenCalledWith({string: "tọa độ"});
    expect(browser.open).toHaveBeenCalledWith({url: "https://maps.goong.io/?lat=10&lng=106"});
  });

  it("uses browser capabilities on web", async () => {
    const navigatorObject = {
      share: vi.fn(),
      clipboard: {writeText: vi.fn()},
    };
    const windowObject = {open: vi.fn()};
    const actions = createActionsAdapter({nativeAndroid: false, navigatorObject, windowObject});

    await actions.shareContent({text: "Địa điểm"});
    await actions.copyText("link");
    await actions.openExternalUrl("https://maps.goong.io/");

    expect(navigatorObject.share).toHaveBeenCalledWith({text: "Địa điểm"});
    expect(navigatorObject.clipboard.writeText).toHaveBeenCalledWith("link");
    expect(windowObject.open).toHaveBeenCalledWith("https://maps.goong.io/", "_blank", "noopener,noreferrer");
  });

  it("falls back to copying the URL when Web Share is unavailable", async () => {
    const writeText = vi.fn();
    const actions = createActionsAdapter({
      nativeAndroid: false,
      navigatorObject: {clipboard: {writeText}},
      windowObject: {},
    });

    await expect(actions.shareContent({url: "https://aether.example/location/1"})).resolves.toBe("shared");
    expect(writeText).toHaveBeenCalledWith("https://aether.example/location/1");
  });

  it("treats share cancellation as a non-error result", async () => {
    const actions = createActionsAdapter({
      nativeAndroid: false,
      navigatorObject: {share: vi.fn().mockRejectedValue({name: "AbortError"})},
      windowObject: {},
    });
    await expect(actions.shareContent({text: "Aether"})).resolves.toBe("cancelled");
  });

  it("rethrows unexpected share errors", async () => {
    const actions = createActionsAdapter({
      nativeAndroid: false,
      navigatorObject: {share: vi.fn().mockRejectedValue(new Error("Share error"))},
      windowObject: {},
    });
    await expect(actions.shareContent({text: "Aether"})).rejects.toThrow("Share error");
  });

  it.each(["http://maps.goong.io", "javascript:alert(1)", "not-a-url"])(
    "rejects unsafe external URL %s",
    async (url) => {
      const actions = createActionsAdapter({nativeAndroid: false, navigatorObject: {}, windowObject: {open: vi.fn()}});
      await expect(actions.openExternalUrl(url)).rejects.toMatchObject({code: "UNSAFE_EXTERNAL_URL"});
    },
  );
});
