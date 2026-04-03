import { Capacitor } from '@capacitor/core';

export function isNative() {
  return Capacitor.isNativePlatform();
}

export function getPlatform() {
  return Capacitor.getPlatform(); // 'ios', 'android', or 'web'
}
