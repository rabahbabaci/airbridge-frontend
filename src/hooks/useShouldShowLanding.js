import { useState } from 'react';
import { isNative } from '@/utils/platform';

/**
 * Decides whether to render the marketing Landing page at `/`.
 *
 * Returns true only for desktop/tablet web visitors (viewport ≥ 1024px).
 * Capacitor native apps and mobile-width web browsers always see Search.
 *
 * Decision is captured ONCE on mount. If a user loads at desktop width and
 * then resizes the window below 1024px, they keep the landing experience
 * for that session. This avoids a jarring mid-session swap between two
 * different app shells, and matches how we treat native vs. web.
 */
export default function useShouldShowLanding() {
    const [shouldShow] = useState(() => {
        if (isNative()) return false;
        if (typeof window === 'undefined') return false;
        return window.innerWidth >= 1024;
    });
    return shouldShow;
}
