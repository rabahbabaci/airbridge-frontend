import React, { createContext, useState, useContext, useCallback } from 'react';

const STORAGE_KEY = 'airbridge_auth';
const AuthContext = createContext();

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
  }, []);

  const logout = useCallback(() => {
    setAuth({ token: null, user_id: null, trip_count: null, tier: null, auth_provider: null, display_name: null });
    localStorage.removeItem(STORAGE_KEY);
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
