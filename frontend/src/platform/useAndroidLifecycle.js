import {useEffect} from "react";
import {App as CapacitorApp} from "@capacitor/app";
import {isNativeAndroid} from "./runtime.js";
import {closeTopOverlay as closeRegisteredOverlay} from "./backStack.js";

const EXIT_WINDOW_MS = 2_000;
const ROOT_PATHS = new Set(["/map", "/discover", "/notifications", "/profile"]);
const isRootPath = (pathname) => ROOT_PATHS.has(pathname) || /^\/profile\/[^/]+$/.test(pathname);

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
  exitApp = () => CapacitorApp.exitApp(),
  notifyExit,
}) {
  useEffect(() => {
    if (!isNativeAndroid()) return undefined;

    const handler = createAndroidBackHandler({
      getPathname: () => location.pathname,
      closeTopOverlay,
      navigate,
      exitApp,
      notifyExit,
    });
    let listener;
    void CapacitorApp.addListener("backButton", handler).then((handle) => {
      listener = handle;
    });

    return () => {
      void listener?.remove();
    };
  }, [closeTopOverlay, exitApp, location.pathname, navigate, notifyExit]);
}
