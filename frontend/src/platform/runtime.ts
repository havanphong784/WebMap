import {Capacitor} from "@capacitor/core";
import {SplashScreen} from "@capacitor/splash-screen";
import {StatusBar, Style} from "@capacitor/status-bar";

export interface CapacitorPlatformRuntime {
  isNativePlatform(): boolean;
  getPlatform?(): string;
}

export interface NativeStatusBarBridge {
  setStyle(options: {style: Style}): Promise<void>;
  setBackgroundColor(options: {color: string}): Promise<void>;
}

export interface NativeSplashScreenBridge {
  hide(): Promise<void>;
}

export interface NativeShellOptions {
  capacitor?: CapacitorPlatformRuntime;
  statusBar?: NativeStatusBarBridge;
  splashScreen?: NativeSplashScreenBridge;
}

export const isNativeAndroid = (capacitor: CapacitorPlatformRuntime = Capacitor): boolean => (
  Boolean(capacitor.isNativePlatform() && capacitor.getPlatform?.() === "android")
);

export const configureNativeShell = async ({
  capacitor = Capacitor,
  statusBar = StatusBar,
  splashScreen = SplashScreen,
}: NativeShellOptions = {}): Promise<void> => {
  if (!isNativeAndroid(capacitor)) return;

  try {
    await statusBar.setStyle({style: Style.Light});
    await statusBar.setBackgroundColor({color: "#F4FBFA"});
  } finally {
    await splashScreen.hide();
  }
};
