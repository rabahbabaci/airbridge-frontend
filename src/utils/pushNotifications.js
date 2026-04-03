import { isNative, getPlatform } from '@/utils/platform';
import { API_BASE } from '@/config';

// No-op on web — all functions safely return without doing anything
const NOOP = () => {};

let listenerHandles = [];

/**
 * Request push notification permission and return the device token.
 * Returns the token string or null if denied/unavailable.
 */
export async function requestPermission() {
  if (!isNative()) return null;

  const { PushNotifications } = await import('@capacitor/push-notifications');

  const permResult = await PushNotifications.requestPermissions();
  if (permResult.receive !== 'granted') return null;

  return new Promise((resolve) => {
    // Listen for registration success
    PushNotifications.addListener('registration', (token) => {
      resolve(token.value);
    });

    // Listen for registration failure
    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration failed:', err);
      resolve(null);
    });

    PushNotifications.register();
  });
}

/**
 * Send the device token to the backend for push delivery.
 */
export async function registerTokenWithBackend(token, authToken) {
  if (!token || !authToken) return;

  const platform = getPlatform(); // 'ios' or 'android'

  try {
    await fetch(`${API_BASE}/v1/devices/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ token, platform }),
    });
  } catch (err) {
    console.error('Failed to register device token:', err);
  }
}

/**
 * Set up foreground and tap notification listeners.
 * @param {Function} onNotificationReceived — called when a notification arrives in foreground
 * @param {Function} onNotificationTapped — called when the user taps a notification
 */
export async function setupPushListeners(onNotificationReceived = NOOP, onNotificationTapped = NOOP) {
  if (!isNative()) return;

  const { PushNotifications } = await import('@capacitor/push-notifications');

  // Foreground notification
  const fgHandle = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
    onNotificationReceived(notification);
  });
  listenerHandles.push(fgHandle);

  // User tapped a notification (background/killed)
  const tapHandle = await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    onNotificationTapped(action.notification);
  });
  listenerHandles.push(tapHandle);
}

/**
 * Remove all push notification listeners.
 */
export async function removePushListeners() {
  for (const handle of listenerHandles) {
    await handle.remove();
  }
  listenerHandles = [];
}
