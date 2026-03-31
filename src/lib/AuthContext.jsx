import React, { createContext, useState, useContext, useCallback } from 'react';
import { identify, resetIdentity } from '@/utils/analytics';

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

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const stored = loadStoredAuth();
    return stored || { token: null, user_id: null, trip_count: null, tier: null, auth_provider: null, display_name: null };
  });

  const isAuthenticated = !!auth.token;
  const isPro = auth.tier === 'pro';
  const remainingProTrips = auth.trip_count != null ? Math.max(0, 3 - auth.trip_count) : null;

  const login = useCallback((data) => {
    const next = {
      token: data.token,
      user_id: data.user_id,
      trip_count: data.trip_count ?? null,
      tier: data.tier ?? 'free',
      auth_provider: data.auth_provider ?? null,
      display_name: data.display_name ?? null,
    };
    setAuth(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    identify(next.user_id, { display_name: next.display_name, tier: next.tier, auth_provider: next.auth_provider });
  }, []);

  const logout = useCallback(() => {
    setAuth({ token: null, user_id: null, trip_count: null, tier: null, auth_provider: null, display_name: null });
    localStorage.removeItem(STORAGE_KEY);
    resetIdentity();
  }, []);

  const updateTripCount = useCallback((count) => {
    setAuth(prev => {
      const next = { ...prev, trip_count: count };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const navigateToLogin = () => {};

  return (
    <AuthContext.Provider value={{
      token: auth.token,
      user_id: auth.user_id,
      trip_count: auth.trip_count,
      tier: auth.tier,
      auth_provider: auth.auth_provider,
      display_name: auth.display_name,
      isAuthenticated,
      isPro,
      remainingProTrips,
      login,
      logout,
      updateTripCount,
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
