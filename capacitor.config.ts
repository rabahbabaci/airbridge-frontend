import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'live.airbridge.app',
  appName: 'AirBridge',
  webDir: 'dist',
  server: {
    allowNavigation: [
      'airbridge-backend-production.up.railway.app',
      'accounts.google.com',
      'oauth2.googleapis.com',
    ],
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'AirBridge',
  },
  plugins: {
    FirebaseMessaging: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
