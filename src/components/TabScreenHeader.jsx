import { Link, useNavigate } from 'react-router-dom';
import { Plane, User } from 'lucide-react';
import TopBar from '@/components/design-system/TopBar';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';

/**
 * TabScreenHeader — shared identity bar for the three tab screens
 * (Search, My Trip, Settings).
 *
 * Renders the AirBridge logomark + wordmark on the left (wrapped in a
 * link to `/` so tapping returns to the search-first home — matches the
 * iOS tab-bar "home" affordance on web, and collapses to the active-trip
 * takeover rule when that fires on `/`) and an avatar circle
 * (authenticated) or "Sign in" pill (unauthenticated) on the right.
 * Tapping the avatar when authenticated routes to Settings; tapping the
 * Sign-in pill when unauthenticated fires the caller's `onSignInClick`
 * callback so the caller owns the AuthModal state.
 *
 * Uses Lucide `Plane` (leaning-right paper-plane silhouette) instead of
 * Phosphor `Airplane` (top-down, points straight up) so the in-app
 * logomark matches the landing page, favicon, and iOS app icon. One
 * visual family everywhere.
 *
 * Deviates from brief §2.4 / §4.14 / §4.2's per-screen top-bar specs in
 * favor of a consistent identity anchor across all three tabs. Brief to
 * be updated post-pitch.
 */
function initials(name) {
    if (!name) return '';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
}

export default function TabScreenHeader({ onSignInClick }) {
    const navigate = useNavigate();
    const { display_name, isAuthenticated } = useAuth();
    // Initials when we have a display_name; null otherwise. null triggers the
    // Lucide User icon fallback below — the prior '👤' emoji fallback rendered
    // via iOS's default emoji font which looked like a broken placeholder on
    // native. On Apple Sign-In specifically, display_name is often null after
    // the first sign-in (Apple's plugin only returns fullName on initial auth;
    // subsequent re-auth returns nil, so if the backend didn't persist the
    // name from first sign-in, the client has nothing to render). The icon
    // fallback is deterministic and reads as a deliberate neutral state.
    const avatarInitials = initials(display_name);

    const handleAuthTap = () => {
        if (isAuthenticated) navigate(createPageUrl('Settings'));
        else onSignInClick?.();
    };

    return (
        <TopBar
            variant="translucent"
            align="left"
            leftSlot={
                <Link
                    to="/"
                    aria-label="AirBridge home"
                    className="flex items-center gap-c-2 -m-c-1 p-c-1 rounded-c-md hover:bg-c-ground-sunken/40 transition-colors"
                >
                    <div className="w-10 h-10 rounded-c-sm bg-c-brand-primary flex items-center justify-center">
                        <Plane
                            className="text-c-text-inverse"
                            style={{ width: 22, height: 22 }}
                            strokeWidth={2.5}
                        />
                    </div>
                    <span className="c-type-title text-c-text-primary">AirBridge</span>
                </Link>
            }
            rightSlot={
                isAuthenticated ? (
                    <button
                        type="button"
                        onClick={handleAuthTap}
                        aria-label="Settings"
                        className="w-11 h-11 rounded-c-pill bg-c-brand-primary text-c-text-inverse c-type-footnote font-bold flex items-center justify-center hover:bg-c-brand-primary-hover transition-colors"
                    >
                        {avatarInitials || <User className="text-c-text-inverse" style={{ width: 20, height: 20 }} strokeWidth={2.25} aria-hidden="true" />}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleAuthTap}
                        aria-label="Sign in"
                        className="h-11 px-c-4 rounded-c-pill bg-c-brand-primary text-c-text-inverse c-type-footnote font-semibold hover:bg-c-brand-primary-hover transition-colors"
                    >
                        Sign in
                    </button>
                )
            }
        />
    );
}
