import type {CapacitorConfig} from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.aether.geo",
  appName: "Aether Geo",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ["google.com"],
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1500,
    },
  },
};

export default config;
