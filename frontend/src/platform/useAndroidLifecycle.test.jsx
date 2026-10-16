import {describe, expect, it, vi} from "vitest";
import {createAndroidBackHandler} from "./useAndroidLifecycle.js";

describe("Android Back behavior", () => {
  it("closes an overlay before navigating", () => {
    const navigate = vi.fn();
    const exitApp = vi.fn();
    const handler = createAndroidBackHandler({
      getPathname: () => "/discover/place",
      closeTopOverlay: () => true,
      navigate,
      exitApp,
      now: () => 100,
    });

    expect(handler({canGoBack: true})).toBe("overlay");
    expect(navigate).not.toHaveBeenCalled();
    expect(exitApp).not.toHaveBeenCalled();
  });

  it("uses browser history away from a root tab", () => {
    const navigate = vi.fn();
    const handler = createAndroidBackHandler({
      getPathname: () => "/login",
      closeTopOverlay: () => false,
      navigate,
      exitApp: vi.fn(),
      now: () => 100,
    });

    expect(handler({canGoBack: true})).toBe("history");
    expect(navigate).toHaveBeenCalledWith(-1);
  });

  it.each(["/map", "/discover", "/notifications", "/profile", "/profile/user-1"])(
    "requires a second Back within two seconds to exit from %s",
    (pathname) => {
      let time = 1_000;
      const exitApp = vi.fn();
      const notifyExit = vi.fn();
      const handler = createAndroidBackHandler({
        getPathname: () => pathname,
        closeTopOverlay: () => false,
        navigate: vi.fn(),
        exitApp,
        notifyExit,
        now: () => time,
      });

      expect(handler({canGoBack: false})).toBe("armed");
      expect(notifyExit).toHaveBeenCalledOnce();
      expect(exitApp).not.toHaveBeenCalled();
      time = 2_999;
      expect(handler({canGoBack: false})).toBe("exit");
      expect(exitApp).toHaveBeenCalledOnce();
    },
  );
});
