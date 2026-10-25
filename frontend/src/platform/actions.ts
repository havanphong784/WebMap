import {Browser} from "@capacitor/browser";
import {Clipboard} from "@capacitor/clipboard";
import {Share, type ShareOptions} from "@capacitor/share";
import {isNativeAndroid} from "./runtime.js";

export type ShareStatus = "shared" | "cancelled";

export interface LocationShareOptions {
  lat?: number | string;
  lng?: number | string;
  locationId?: number | string;
}

export interface NativeShareBridge {
  share(options: ShareOptions): Promise<unknown>;
}

export interface NativeClipboardBridge {
  write(options: {string?: string}): Promise<void>;
}

export interface NativeBrowserBridge {
  open(options: {url: string}): Promise<void>;
}

export interface BrowserNavigator {
  clipboard?: {
    writeText(text: string): Promise<void>;
  };
  share?: (data?: any) => Promise<void>;
}

export interface BrowserWindow {
  open?: (url: string, target?: string, features?: string) => Window | null | void;
}

export interface ActionsAdapterOptions {
  nativeAndroid?: boolean;
  share?: NativeShareBridge;
  clipboard?: NativeClipboardBridge;
  browser?: NativeBrowserBridge;
  navigatorObject?: BrowserNavigator;
  windowObject?: BrowserWindow;
}

export interface ActionsAdapter {
  shareContent(content: ShareOptions): Promise<ShareStatus>;
  copyText(text: string): Promise<void>;
  openExternalUrl(value: string): Promise<void>;
}

const isCancelled = (error: unknown): boolean => {
  const err = error as {name?: string; code?: string; message?: string} | undefined;
  const value = `${err?.name || ""} ${err?.code || ""} ${err?.message || ""}`.toLowerCase();
  return value.includes("abort") || value.includes("cancel");
};

const validateExternalUrl = (value: string): string => {
  let url: URL;
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

export const buildLocationShareUrl = (
  publicWebUrl: string,
  {lat, lng, locationId}: LocationShareOptions = {}
): string => {
  const url = new URL("/", validateExternalUrl(publicWebUrl));
  if (lat !== undefined && lat !== null) url.searchParams.set("lat", String(lat));
  if (lng !== undefined && lng !== null) url.searchParams.set("lng", String(lng));
  if (locationId !== undefined && locationId !== null && locationId !== "") {
    url.searchParams.set("locationId", String(locationId));
  }
  return url.toString();
};

export const createActionsAdapter = ({
  nativeAndroid = isNativeAndroid(),
  share = Share,
  clipboard = Clipboard,
  browser = Browser,
  navigatorObject = globalThis.navigator,
  windowObject = globalThis.window,
}: ActionsAdapterOptions = {}): ActionsAdapter => {
  const copyText = async (text: string): Promise<void> => {
    if (nativeAndroid) {
      await clipboard.write({string: text});
      return;
    }
    if (!navigatorObject?.clipboard?.writeText) throw new Error("Clipboard không khả dụng");
    await navigatorObject.clipboard.writeText(text);
  };

  const shareContent = async (content: ShareOptions): Promise<ShareStatus> => {
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

  const openExternalUrl = async (value: string): Promise<void> => {
    const url = validateExternalUrl(value);
    if (nativeAndroid) {
      await browser.open({url});
      return;
    }
    windowObject.open?.(url, "_blank", "noopener,noreferrer");
  };

  return {shareContent, copyText, openExternalUrl};
};

const actions = createActionsAdapter();
export const shareContent = actions.shareContent;
export const copyText = actions.copyText;
export const openExternalUrl = actions.openExternalUrl;
