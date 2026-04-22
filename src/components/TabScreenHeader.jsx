import { useNavigate } from 'react-router-dom';
import { Airplane } from '@phosphor-icons/react';
import TopBar from '@/components/design-system/TopBar';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';

/**
 * TabScreenHeader — shared identity bar for the three tab screens
 * (Search, My Trip, Settings).
 *
 * Renders the AirBridge logomark + wordmark on the left and an avatar
 * circle (authenticated) or "Sign in" pill (unauthenticated) on the right.
 * Tapping the avatar when authenticated routes to Settings; tapping the
 * Sign-in pill when unauthenticated fires the caller's `onSignInClick`
 * callback so the caller owns the AuthModal state.
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
    const avatarInitials = initials(display_name) || '👤';

    const handleAuthTap = () => {
        if (isAuthenticated) navigate(createPageUrl('Settings'));
        else onSignInClick?.();
    };

    return (
        <TopBar
            variant="translucent"
            align="left"
            leftSlot={
                <div className="flex items-center gap-c-2">
                    <div className="w-10 h-10 rounded-c-sm bg-c-brand-primary flex items-center justify-center">
                        <Airplane size={22} weight="bold" className="text-c-text-inverse" />
                    </div>
                    <span className="c-type-title text-c-text-primary">AirBridge</span>
                </div>
            }
            rightSlot={
                isAuthenticated ? (
                    <button
                        type="button"
                        onClick={handleAuthTap}
                        aria-label="Settings"
                        className="w-11 h-11 rounded-c-pill bg-c-brand-primary text-c-text-inverse c-type-footnote font-bold flex items-center justify-center hover:bg-c-brand-primary-hover transition-colors"
                    >
                        {avatarInitials}
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
