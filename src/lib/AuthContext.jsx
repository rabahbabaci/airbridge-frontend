import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { identify, resetIdentity } from '@/utils/analytics';
import { API_BASE } from '@/config';
import { isNative } from '@/utils/platform';
import { App } from '@capacitor/app';

const STORAGE_KEY = 'airbridge_auth';
const CLEANUP_FLAG = 'airbridge_cleanup_v1';
const AuthContext = createContext();

// One-time removal of dead Base44 localStorage keys
if (!localStorage.getItem(CLEANUP_FLAG)) {
  ['base44_analytics_session_id', 'base44_app_id', 'base44_from_url', 'base44_functions_version']
    .forEach(k => localStorage.removeItem(k));
  localStorage.setItem(CLEANUP_FLAG, '1');
}

function loadStoredAuth() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.token) return parsed;
  } catch {}
  return null;
}

const EMPTY_AUTH = {
  token: null,
  user_id: null,
  trip_count: null,
  tier: null,
  subStatus: null,
  auth_provider: null,
  display_name: null,
};

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const stored = loadStoredAuth();
    return stored ? { ...EMPTY_AUTH, ...stored } : EMPTY_AUTH;
  });

  const isAuthenticated = !!auth.token;

  // Centralized Pro check (Sprint 6 F6.2):
  //   - Active Stripe subscription → Pro
  //   - Free trial (first 3 trips) → Pro
  //   - Unknown trip_count yet → assume Pro to avoid premature gating flicker
  const isPro = (
    auth.subStatus?.subscription_status === 'active'
    || auth.trip_count == null
    || auth.trip_count <= 3
  );

  const remainingProTrips = auth.trip_count != null ? Math.max(0, 3 - auth.trip_count) : null;

  const persist = (next) => {
    setAuth(next);
    if (next.token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const refreshSubscriptionStatus = useCallback(async (overrideToken) => {
    const t = overrideToken || auth.token;
    if (!t) return null;
    try {
      const res = await fetch(`${API_BASE}/v1/subscriptions/status`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      setAuth(prev => {
        const next = { ...prev, subStatus: data };
        if (next.token) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      return data;
    } catch (err) {
      console.error('refreshSubscriptionStatus failed:', err);
      return null;
    }
  }, [auth.token]);

  const login = useCallback((data) => {
    const next = {
      token: data.token,
      user_id: data.user_id,
      trip_count: data.trip_count ?? null,
      tier: data.tier ?? 'free',
      subStatus: null,
      auth_provider: data.auth_provider ?? null,
      display_name: data.display_name ?? null,
    };
    persist(next);
    identify(next.user_id, { display_name: next.display_name, tier: next.tier, auth_provider: next.auth_provider });
    // Fetch authoritative subscription status right after login.
    refreshSubscriptionStatus(next.token);
  }, [refreshSubscriptionStatus]);

  const logout = useCallback(() => {
    persist(EMPTY_AUTH);
    resetIdentity();
  }, []);

  const updateTripCount = useCallback((count) => {
    setAuth(prev => {
      const next = { ...prev, trip_count: count };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    // Trial may have just expired — refetch subscription status.
    refreshSubscriptionStatus();
  }, [refreshSubscriptionStatus]);

  // Keep a ref to the current token so the visibilitychange handler
  // doesn't close over a stale value.
  const tokenRef = useRef(auth.token);
  useEffect(() => { tokenRef.current = auth.token; }, [auth.token]);

  // On mount with a stored token, refresh subscription status so the
  // cached value isn't stale across sessions.
  // Also refresh when the app/tab regains visibility (e.g. returning from
  // Stripe billing portal in Safari).
  const lastRefreshRef = useRef(0);
  useEffect(() => {
    if (auth.token) refreshSubscriptionStatus(auth.token);

    const guardedRefresh = () => {
      if (!tokenRef.current) return;
      const now = Date.now();
      if (now - lastRefreshRef.current < 2000) return;
      lastRefreshRef.current = now;
      refreshSubscriptionStatus();
    };

    // Web: tab regains focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') guardedRefresh();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Native (Capacitor): app returns to foreground (e.g. after Browser.open
    // for Stripe portal)
    let nativeListener;
    if (isNative()) {
      nativeListener = App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) guardedRefresh();
      });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      nativeListener?.then(handle => handle.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigateToLogin = () => {};

  return (
    <AuthContext.Provider value={{
      token: auth.token,
      user_id: auth.user_id,
      trip_count: auth.trip_count,
      tier: auth.tier,
      subStatus: auth.subStatus,
      auth_provider: auth.auth_provider,
      display_name: auth.display_name,
      isAuthenticated,
      isPro,
      remainingProTrips,
      login,
      logout,
      updateTripCount,
      refreshSubscriptionStatus,
      navigateToLogin,
      // Kept for compatibility
      user: auth.user_id ? { id: auth.user_id } : null,
      isLoadingAuth: false,
      isLoadingPublicSettings: false,
      authError: null,
      appPublicSettings: null,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
