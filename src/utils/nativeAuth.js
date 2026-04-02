import { registerPlugin } from '@capacitor/core';
import { isNative } from './platform';

export const AppleSignIn = isNative() ? registerPlugin('AppleSignIn') : null;
export const GoogleSignIn = isNative() ? registerPlugin('GoogleSignIn') : null;
