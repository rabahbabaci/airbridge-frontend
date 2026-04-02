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
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '416070164916-m6s2e5legchoeim69h4ejn4rrcbafvb4.apps.googleusercontent.com',
      forceCodeForRefreshToken: false,
    },
  },
};

export default config;
