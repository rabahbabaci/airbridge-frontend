import { useState, useEffect, useRef } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import FeedbackPrompt from '@/components/FeedbackPrompt';
import { API_BASE } from '@/config';
import { createPageUrl } from '@/utils';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import DesignSystem from '@/pages/DesignSystem';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const TAKEOVER_STATUSES = ['active', 'en_route', 'at_airport', 'at_gate'];

function isDepartingWithin24h(trip) {
  const depUtc = trip.projected_timeline?.departure_utc;
  if (depUtc) {
    const diff = new Date(depUtc) - Date.now();
    return diff > 0 && diff < 24 * 60 * 60 * 1000;
  }
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  return trip.departure_date === today || trip.departure_date === tomorrow;
}

function TripAwareHome({ children }) {
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(isAuthenticated);
  const didRedirect = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !token || didRedirect.current) {
      setChecking(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/v1/trips/active-list`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setChecking(false); return; }
        const data = await res.json();
        const trips = (data.trips || []).filter(
          t => TAKEOVER_STATUSES.includes(t.status) && isDepartingWithin24h(t)
        );

        if (trips.length === 1) {
          didRedirect.current = true;
          navigate(createPageUrl('Engine'), { state: { viewTrip: trips[0] }, replace: true });
          return;
        }
        if (trips.length >= 2) {
          didRedirect.current = true;
          navigate(createPageUrl('Trips'), { replace: true });
          return;
        }
      } catch {
        // Silent fallback to Home
      }
      setChecking(false);
    })();
  }, [isAuthenticated, token, navigate]);

  if (checking) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-secondary/50">
        <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return children;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <>
      <Routes>
        <Route path="/" element={
          <TripAwareHome>
            <LayoutWrapper currentPageName={mainPageKey}>
              <MainPage />
            </LayoutWrapper>
          </TripAwareHome>
        } />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            }
          />
        ))}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/design-system" element={<DesignSystem />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      <FeedbackPrompt />
    </>
  );
};


function App() {

  return (
    <AuthProvider>
      <Router>
        <AuthenticatedApp />
      </Router>
      <Toaster />
    </AuthProvider>
  )
}

export default App
