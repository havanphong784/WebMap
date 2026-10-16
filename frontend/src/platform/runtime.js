import {Capacitor} from "@capacitor/core";
import {SplashScreen} from "@capacitor/splash-screen";
import {StatusBar, Style} from "@capacitor/status-bar";

export const isNativeAndroid = (capacitor = Capacitor) => (
  capacitor.isNativePlatform() && capacitor.getPlatform() === "android"
);

export const configureNativeShell = async ({
  capacitor = Capacitor,
  statusBar = StatusBar,
  splashScreen = SplashScreen,
} = {}) => {
  if (!isNativeAndroid(capacitor)) return;

  try {
    await statusBar.setStyle({style: Style.Light});
    await statusBar.setBackgroundColor({color: "#F4FBFA"});
  } finally {
    await splashScreen.hide();
  }
};
