import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';

/**
 * Shared TabBar navigation logic for the 3 app-shell screens
 * (Search, ActiveTripView, ResultsView) that show the DS TabBar.
 *
 * Tabs map to:
 *   'search'   → /search (public)
 *   'trip'     → /Trips (auth-gated — shows AuthModal when unauth)
 *   'settings' → /Settings (auth-gated)
 *
 * Auth-gated tabs defer navigation until after a successful sign-in.
 * `selfTabValue` (optional) lets a screen declare the tab it already
 * represents so taps on that tab become no-ops.
 *
 * Returns:
 *   handleTabChange      — wire to TabBar onChange
 *   authOpen / setAuthOpen — wire to AuthModal open/onOpenChange
 *   handleAuthSuccess    — wire to AuthModal onSuccess; calls login(data)
 *                          and then navigates to the deferred destination
 */
export default function useAuthGatedTabs(selfTabValue) {
    const navigate = useNavigate();
    const { isAuthenticated, login } = useAuth();
    const [authOpen, setAuthOpen] = useState(false);
    const pendingDestinationRef = useRef(null);

    const destinationFor = (value) => {
        if (value === 'search') return '/search';
        if (value === 'trip') return createPageUrl('Trips');
        if (value === 'settings') return createPageUrl('Settings');
        return null;
    };

    const handleTabChange = (value) => {
        if (value === selfTabValue) return;
        const dest = destinationFor(value);
        if (!dest) return;
        const needsAuth = value === 'trip' || value === 'settings';
        if (needsAuth && !isAuthenticated) {
            pendingDestinationRef.current = dest;
            setAuthOpen(true);
            return;
        }
        navigate(dest);
    };

    const handleAuthSuccess = (data) => {
        login(data);
        const dest = pendingDestinationRef.current;
        pendingDestinationRef.current = null;
        setAuthOpen(false);
        if (dest) navigate(dest);
    };

    return { handleTabChange, authOpen, setAuthOpen, handleAuthSuccess };
}
