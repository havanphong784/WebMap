import {useEffect, useRef} from "react";
import {App as CapacitorApp} from "@capacitor/app";
import {isNativeAndroid} from "./runtime.js";
import {closeTopOverlay as closeRegisteredOverlay} from "./backStack.js";

const EXIT_WINDOW_MS = 2_000;
const ROOT_PATHS = new Set(["/map", "/discover", "/notifications", "/profile"]);
const isRootPath = (pathname) => ROOT_PATHS.has(pathname) || /^\/profile\/[^/]+$/.test(pathname);
const exitNativeApp = () => CapacitorApp.exitApp();

export const subscribeAndroidBackButton = (app, handler) => {
  let disposed = false;
  let listener;
  void app.addListener("backButton", handler).then((handle) => {
    if (disposed) void handle.remove();
    else listener = handle;
  });
  return () => {
    disposed = true;
    void listener?.remove();
  };
};

export const createAndroidBackHandler = ({
  getPathname,
  closeTopOverlay,
  navigate,
  exitApp,
  notifyExit = () => {},
  now = Date.now,
}) => {
  let armedAt = 0;

  return ({canGoBack = false} = {}) => {
    if (closeTopOverlay()) return "overlay";

    const pathname = getPathname();
    if (canGoBack && !isRootPath(pathname)) {
      navigate(-1);
      return "history";
    }

    const currentTime = now();
    if (armedAt > 0 && currentTime - armedAt <= EXIT_WINDOW_MS) {
      exitApp();
      armedAt = 0;
      return "exit";
    }

    armedAt = currentTime;
    notifyExit();
    return "armed";
  };
};

export default function useAndroidLifecycle({
  navigate,
  location,
  closeTopOverlay = closeRegisteredOverlay,
  exitApp = exitNativeApp,
  notifyExit,
}) {
  const current = useRef({navigate, location, closeTopOverlay, exitApp, notifyExit});
  useEffect(() => {
    current.current = {navigate, location, closeTopOverlay, exitApp, notifyExit};
  }, [navigate, location, closeTopOverlay, exitApp, notifyExit]);

  useEffect(() => {
    if (!isNativeAndroid()) return undefined;

    const handler = createAndroidBackHandler({
      getPathname: () => current.current.location.pathname,
      closeTopOverlay: () => current.current.closeTopOverlay(),
      navigate: (...args) => current.current.navigate(...args),
      exitApp: () => current.current.exitApp(),
      notifyExit: () => current.current.notifyExit?.(),
    });
    return subscribeAndroidBackButton(CapacitorApp, handler);
  }, []);
}
