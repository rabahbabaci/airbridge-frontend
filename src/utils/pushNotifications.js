import { isNative, getPlatform } from '@/utils/platform';
import { API_BASE } from '@/config';

const NOOP = () => {};

let listenerHandles = [];

/**
 * Request push notification permission and return the FCM device token.
 * Returns the token string or null if denied/unavailable.
 */
export async function requestPermission() {
  if (!isNative()) return null;

  const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');

  const permResult = await FirebaseMessaging.requestPermissions();
  if (permResult.receive !== 'granted') return null;

  const { token } = await FirebaseMessaging.getToken();
  return token || null;
}

/**
 * Send the FCM device token to the backend for push delivery.
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

  const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');

  const fgHandle = await FirebaseMessaging.addListener('notificationReceived', (event) => {
    onNotificationReceived(event.notification);
  });
  listenerHandles.push(fgHandle);

  const tapHandle = await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
    onNotificationTapped(event.notification);
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
