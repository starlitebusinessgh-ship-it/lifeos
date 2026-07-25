import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: "com.lifeos.app",
  appName: "LifeOS",
  webDir: "public",
  server: serverUrl
    ? { url: serverUrl, cleartext: serverUrl.startsWith("http://") }
    : undefined,
  plugins: {
    LocalNotifications: {
      iconColor: "#FF6B2B",
      sound: "alarm.wav",
    },
  },
};

export default config;
