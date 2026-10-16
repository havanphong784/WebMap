import {describe, expect, it, vi} from "vitest";
import {configureNativeShell, isNativeAndroid} from "./runtime.js";

describe("native runtime", () => {
  it("does nothing in a browser", async () => {
    const statusBar = {setStyle: vi.fn()};
    const splashScreen = {hide: vi.fn()};

    expect(isNativeAndroid({isNativePlatform: () => false, getPlatform: () => "web"})).toBe(false);
    await configureNativeShell({capacitor: {isNativePlatform: () => false}, statusBar, splashScreen});

    expect(statusBar.setStyle).not.toHaveBeenCalled();
    expect(splashScreen.hide).not.toHaveBeenCalled();
  });

  it("configures light Android system bars and hides the splash", async () => {
    const statusBar = {setStyle: vi.fn(), setBackgroundColor: vi.fn()};
    const splashScreen = {hide: vi.fn()};
    const capacitor = {isNativePlatform: () => true, getPlatform: () => "android"};

    await configureNativeShell({capacitor, statusBar, splashScreen});

    expect(statusBar.setStyle).toHaveBeenCalledWith({style: "LIGHT"});
    expect(statusBar.setBackgroundColor).toHaveBeenCalledWith({color: "#F4FBFA"});
    expect(splashScreen.hide).toHaveBeenCalledOnce();
  });

  it("always hides the splash when Android system-bar configuration fails", async () => {
    const statusError = new Error("Status bar unavailable");
    const statusBar = {
      setStyle: vi.fn().mockRejectedValue(statusError),
      setBackgroundColor: vi.fn(),
    };
    const splashScreen = {hide: vi.fn()};
    const capacitor = {isNativePlatform: () => true, getPlatform: () => "android"};

    await expect(configureNativeShell({capacitor, statusBar, splashScreen})).rejects.toBe(statusError);
    expect(splashScreen.hide).toHaveBeenCalledOnce();
  });
});
