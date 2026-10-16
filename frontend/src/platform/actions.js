import {Browser} from "@capacitor/browser";
import {Clipboard} from "@capacitor/clipboard";
import {Share} from "@capacitor/share";
import {isNativeAndroid} from "./runtime.js";

const isCancelled = (error) => {
  const value = `${error?.name || ""} ${error?.code || ""} ${error?.message || ""}`.toLowerCase();
  return value.includes("abort") || value.includes("cancel");
};

const validateExternalUrl = (value) => {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw Object.assign(new Error("Liên kết ngoài không hợp lệ"), {code: "UNSAFE_EXTERNAL_URL"});
  }
  if (url.protocol !== "https:") {
    throw Object.assign(new Error("Chỉ cho phép liên kết HTTPS"), {code: "UNSAFE_EXTERNAL_URL"});
  }
  return url.toString();
};

export const buildLocationShareUrl = (publicWebUrl, {lat, lng, locationId} = {}) => {
  const url = new URL("/", validateExternalUrl(publicWebUrl));
  url.searchParams.set("lat", lat);
  url.searchParams.set("lng", lng);
  if (locationId) url.searchParams.set("locationId", locationId);
  return url.toString();
};

export const createActionsAdapter = ({
  nativeAndroid = isNativeAndroid(),
  share = Share,
  clipboard = Clipboard,
  browser = Browser,
  navigatorObject = globalThis.navigator,
  windowObject = globalThis.window,
} = {}) => {
  const copyText = async (text) => {
    if (nativeAndroid) return clipboard.write({string: text});
    if (!navigatorObject?.clipboard?.writeText) throw new Error("Clipboard không khả dụng");
    return navigatorObject.clipboard.writeText(text);
  };

  const shareContent = async (content) => {
    try {
      if (nativeAndroid) {
        await share.share(content);
      } else if (navigatorObject?.share) {
        await navigatorObject.share(content);
      } else if (content.url) {
        await copyText(content.url);
      } else {
        throw new Error("Chia sẻ không khả dụng");
      }
      return "shared";
    } catch (error) {
      if (isCancelled(error)) return "cancelled";
      throw error;
    }
  };

  const openExternalUrl = async (value) => {
    const url = validateExternalUrl(value);
    if (nativeAndroid) return browser.open({url});
    windowObject.open(url, "_blank", "noopener,noreferrer");
  };

  return {shareContent, copyText, openExternalUrl};
};

const actions = createActionsAdapter();
export const shareContent = actions.shareContent;
export const copyText = actions.copyText;
export const openExternalUrl = actions.openExternalUrl;
