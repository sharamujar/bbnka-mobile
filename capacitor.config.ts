import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize, KeyboardStyle } from "@capacitor/keyboard";

const config: CapacitorConfig = {
  appId: "bbnka.mobile",
  appName: "bbnka-mobile",
  webDir: "dist",
  bundledWebRuntime: false,
  plugins: {
    Keyboard: {
      resize: KeyboardResize.Body,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true,
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"],
    },
    GoogleAuth: {
      scopes: ["profile", "email"],
      serverClientId:
        "214639010070-ukg4a3c95t0tlhov4hpinrcdcbgn829s.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
    StatusBar: {
      backgroundColor: "#000000",
      style: "dark",
      overlaysWebView: false,
    },
  },
  android: {
    navigationBarColor: "#000000",
    navigationBarDividerColor: "#000000",
    navigationBarLight: false,
    layoutInDisplayCutoutMode: "shortEdges",
  },
};

export default config;
