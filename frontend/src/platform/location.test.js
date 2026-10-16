import {describe, expect, it, vi} from "vitest";
import {createLocationAdapter} from "./location.js";

describe("location adapter", () => {
  it("uses browser geolocation and normalizes watch cleanup", async () => {
    const clearWatch = vi.fn();
    const browserGeolocation = {
      getCurrentPosition: vi.fn((success) => success({coords: {latitude: 10, longitude: 106, accuracy: 8}})),
      watchPosition: vi.fn((success) => {
        success({coords: {latitude: 11, longitude: 107, accuracy: 9}});
        return 42;
      }),
      clearWatch,
    };
    const adapter = createLocationAdapter({nativeAndroid: false, browserGeolocation});

    await expect(adapter.getCurrentPosition()).resolves.toMatchObject({coords: {latitude: 10, longitude: 106}});
    const onPosition = vi.fn();
    const stop = await adapter.watchPosition({}, onPosition, vi.fn());
    expect(onPosition).toHaveBeenCalledWith(expect.objectContaining({
      coords: expect.objectContaining({latitude: 11}),
    }));
    await stop();
    expect(clearWatch).toHaveBeenCalledWith(42);
  });

  it("requests native permission when it is promptable", async () => {
    const plugin = {
      checkPermissions: vi.fn().mockResolvedValue({location: "prompt"}),
      requestPermissions: vi.fn().mockResolvedValue({location: "granted"}),
    };
    const adapter = createLocationAdapter({nativeAndroid: true, plugin});

    await expect(adapter.requestLocationPermission()).resolves.toBe("granted");
    expect(plugin.requestPermissions).toHaveBeenCalledOnce();
  });

  it.each(["denied", "prompt-with-rationale"])("normalizes native %s permission to denied", async (state) => {
    const adapter = createLocationAdapter({
      nativeAndroid: true,
      plugin: {checkPermissions: vi.fn().mockResolvedValue({location: state})},
    });
    await expect(adapter.requestLocationPermission()).resolves.toBe("denied");
  });

  it("clears a native position watch", async () => {
    const plugin = {
      checkPermissions: vi.fn().mockResolvedValue({location: "granted"}),
      watchPosition: vi.fn().mockResolvedValue("native-watch"),
      clearWatch: vi.fn(),
    };
    const adapter = createLocationAdapter({nativeAndroid: true, plugin});
    const stop = await adapter.watchPosition({enableHighAccuracy: true}, vi.fn(), vi.fn());
    await stop();
    expect(plugin.clearWatch).toHaveBeenCalledWith({id: "native-watch"});
  });

  it("reports an unavailable provider as a recoverable normalized error", async () => {
    const adapter = createLocationAdapter({nativeAndroid: false, browserGeolocation: undefined});
    await expect(adapter.getCurrentPosition()).rejects.toMatchObject({
      code: "LOCATION_UNAVAILABLE",
      recoverable: true,
    });
  });
});
