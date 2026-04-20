import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Browser } from '@capacitor/browser';
import { createPageUrl } from '@/utils';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/AuthContext';
import { API_BASE } from '@/config';
import { isNative } from '@/utils/platform';
import PaywallModal from '@/components/PaywallModal';
import {
    ArrowLeft, Plane, Car, Train, Bus, ShieldCheck,
    Smartphone, Baby, Clock, LogOut, Mail, User,
    Map, Navigation, ExternalLink, Bell, CreditCard, Info,
    Settings as SettingsIcon, Check, AlertCircle, FileText, History,
} from 'lucide-react';

const TRANSPORT_OPTIONS = [
    { id: 'rideshare', label: 'Rideshare', icon: Car },
    { id: 'driving', label: 'Drive', icon: Car },
    { id: 'train', label: 'Train', icon: Train },
    { id: 'bus', label: 'Bus', icon: Bus },
];

const BUFFER_PRESETS = [
    { label: 'Tight · 15 min', value: 15 },
    { label: 'Comfortable · 30 min', value: 30 },
    { label: 'Relaxed · 60 min', value: 60 },
];

const NAV_APP_OPTIONS = [
    { id: 'apple_maps', label: 'Apple Maps', icon: Map },
    { id: 'google_maps', label: 'Google Maps', icon: Navigation },
    { id: 'waze', label: 'Waze', icon: Navigation },
];

const RIDESHARE_APP_OPTIONS = [
    { id: 'uber', label: 'Uber', icon: Car },
    { id: 'lyft', label: 'Lyft', icon: Car },
];

const LS_NAV_KEY = 'airbridge_preferred_nav';
const LS_RIDE_KEY = 'airbridge_preferred_rideshare';
const LS_NOTIF_KEY = 'airbridge_notification_prefs';

function loadLocalPref(key, fallback) {
    try {
        return localStorage.getItem(key) || fallback;
    } catch {
        return fallback;
    }
}

function SectionCard({ title, icon: Icon, children }) {
    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
            <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
                {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                <h3 className="font-bold text-foreground text-sm">{title}</h3>
            </div>
            <div className="px-5 py-4 space-y-4">
                {children}
            </div>
        </div>
    );
}

function ProviderBadge({ provider }) {
    const label = provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple' : provider === 'phone' ? 'Phone' : provider || 'Unknown';
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent text-primary text-xs font-bold">
            {label}
        </span>
    );
}

export default function Settings() {
    const navigate = useNavigate();
    const { token, isAuthenticated, display_name, auth_provider, logout, trip_count, subStatus, isPro, refreshSubscriptionStatus } = useAuth();
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    // Redirect if not authenticated
    useEffect(() => {
        if (!isAuthenticated) navigate(createPageUrl('Home'), { replace: true });
    }, [isAuthenticated, navigate]);

    // Account info from API
    const [email, setEmail] = useState('');
    const [loadingProfile, setLoadingProfile] = useState(true);

    // Preferences
    const [transport, setTransport] = useState('rideshare');
    const [hasPrecheck, setHasPrecheck] = useState(false);
    const [hasClear, setHasClear] = useState(false);
    const [hasPriorityLane, setHasPriorityLane] = useState(false);
    const [hasBoardingPass, setHasBoardingPass] = useState(true);
    const [withChildren, setWithChildren] = useState(false);
    const [gateTime, setGateTime] = useState(30);

    // Local-only prefs
    const [navApp, setNavApp] = useState(() => loadLocalPref(LS_NAV_KEY, 'apple_maps'));
    const [rideshareApp, setRideshareApp] = useState(() => loadLocalPref(LS_RIDE_KEY, 'uber'));

    // Notification prefs (local-only until push is live)
    const [notifPrefs, setNotifPrefs] = useState(() => {
        const defaults = { leave_time: true, delays: true, time_to_go: true, gate_change: false, trip_summary: false };
        try {
            const raw = localStorage.getItem(LS_NOTIF_KEY);
            return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
        } catch { return defaults; }
    });
    function setNotif(key, value) {
        setNotifPrefs(prev => {
            const next = { ...prev, [key]: value };
            try { localStorage.setItem(LS_NOTIF_KEY, JSON.stringify(next)); } catch {}
            return next;
        });
    }

    // Save status
    const [saveStatus, setSaveStatus] = useState(null); // 'saving' | 'saved' | null
    const saveTimerRef = useRef(null);
    const debounceRef = useRef(null);

    // Subscription management (F6.3)
    const [paywallOpen, setPaywallOpen] = useState(false);
    const [openingPortal, setOpeningPortal] = useState(false);
    const [portalError, setPortalError] = useState(null);

    const handleManageSubscription = useCallback(async () => {
        if (!token || openingPortal) return;
        setOpeningPortal(true);
        setPortalError(null);
        try {
            const res = await fetch(`${API_BASE}/v1/subscriptions/portal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                throw new Error(`Portal failed (${res.status})`);
            }
            const data = await res.json();
            if (!data.portal_url) throw new Error('Missing portal URL');
            if (isNative()) {
                await Browser.open({ url: data.portal_url });
            } else {
                window.open(data.portal_url, '_blank');
            }
        } catch (err) {
            console.error('Failed to open billing portal:', err);
            setPortalError("Couldn't open the billing portal. Please try again.");
        } finally {
            setOpeningPortal(false);
        }
    }, [token, openingPortal]);

    // Subscription state is owned by AuthContext (Sprint 6 F6.2). We just
    // derive the local view flags from it.
    const tripCount = trip_count ?? 0;
    const isSubActive = subStatus?.subscription_status === 'active';
    const trialRemaining = subStatus?.trial_trips_remaining ?? Math.max(0, 3 - tripCount);
    const loadingSub = subStatus == null;
    const isTrialActive = !isSubActive && trialRemaining > 0;
    const isTrialExpired = !isSubActive && trialRemaining === 0;
    const isSubscribed = isSubActive;

    // ── Poll subscription status after returning from Stripe Checkout ──
    useEffect(() => {
        if (!token) return;
        const params = new URLSearchParams(window.location.search);
        const result = params.get('subscription');
        if (result !== 'success') return;

        let cancelled = false;
        let elapsed = 0;
        const interval = setInterval(async () => {
            if (cancelled) return;
            elapsed += 2000;
            const data = await refreshSubscriptionStatus();
            if (data?.subscription_status === 'active' || elapsed >= 30000) {
                clearInterval(interval);
                const url = new URL(window.location.href);
                url.searchParams.delete('subscription');
                window.history.replaceState({}, '', url.toString());
            }
        }, 2000);

        return () => { cancelled = true; clearInterval(interval); };
    }, [token, refreshSubscriptionStatus]);

    // ── Load profile + preferences ──
    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                const res = await fetch(`${API_BASE}/v1/users/me`, {
                    headers: authHeaders,
                });
                if (res.ok) {
                    const data = await res.json();
                    setEmail(data.email || '');
                    if (data.preferences) {
                        const p = data.preferences;
                        if (p.transport_mode) setTransport(p.transport_mode);
                        if (p.has_boarding_pass != null) setHasBoardingPass(p.has_boarding_pass);
                        if (p.traveling_with_children != null) setWithChildren(p.traveling_with_children);
                        if (p.gate_time_minutes != null) setGateTime(p.gate_time_minutes);
                        // Parse security_access
                        if (p.security_access) {
                            setHasPrecheck(p.security_access === 'precheck' || p.security_access === 'clear_precheck');
                            setHasClear(p.security_access === 'clear' || p.security_access === 'clear_precheck');
                            setHasPriorityLane(p.security_access === 'priority_lane');
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to load profile:', err);
            } finally {
                setLoadingProfile(false);
            }
        })();
    }, [token]);

    // ── Save preferences to backend ──
    const computeSecurityAccess = useCallback(() => {
        if (hasPriorityLane) return 'priority_lane';
        if (hasPrecheck && hasClear) return 'clear_precheck';
        if (hasPrecheck) return 'precheck';
        if (hasClear) return 'clear';
        return 'none';
    }, [hasPrecheck, hasClear, hasPriorityLane]);

    const savePreferences = useCallback(async () => {
        if (!token) return;
        setSaveStatus('saving');
        try {
            await fetch(`${API_BASE}/v1/users/preferences`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    transport_mode: transport,
                    security_access: computeSecurityAccess(),
                    has_boarding_pass: hasBoardingPass,
                    traveling_with_children: withChildren,
                    gate_time_minutes: gateTime,
                }),
            });
            setSaveStatus('saved');
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(() => setSaveStatus(null), 2000);
        } catch (err) {
            console.error('Failed to save preferences:', err);
            setSaveStatus(null);
        }
    }, [token, transport, computeSecurityAccess, hasBoardingPass, withChildren, gateTime]);

    // Debounced save on preference change
    const initialLoadDone = useRef(false);
    useEffect(() => {
        if (loadingProfile) return;
        if (!initialLoadDone.current) {
            initialLoadDone.current = true;
            return;
        }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(savePreferences, 600);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [transport, hasPrecheck, hasClear, hasPriorityLane, hasBoardingPass, withChildren, gateTime, savePreferences, loadingProfile]);

    // ── Security chip handler (same logic as StepDepartureSetup) ──
    const isNoneSecurity = !hasPrecheck && !hasClear && !hasPriorityLane;

    function handleSecurityChip(chip) {
        if (chip === 'none') {
            setHasPrecheck(false);
            setHasClear(false);
            setHasPriorityLane(false);
        } else if (chip === 'precheck') {
            setHasPrecheck(v => !v);
            setHasClear(false);
            setHasPriorityLane(false);
        } else if (chip === 'clear') {
            setHasClear(v => !v);
            setHasPrecheck(false);
            setHasPriorityLane(false);
        } else if (chip === 'clear_precheck') {
            const isComboActive = hasPrecheck && hasClear;
            setHasPrecheck(!isComboActive);
            setHasClear(!isComboActive);
            setHasPriorityLane(false);
        } else if (chip === 'priority') {
            setHasPriorityLane(v => !v);
            if (!hasPriorityLane) { setHasPrecheck(false); setHasClear(false); }
        }
    }

    // ── Local pref handlers ──
    function handleNavApp(id) {
        setNavApp(id);
        try { localStorage.setItem(LS_NAV_KEY, id); } catch {}
    }

    function handleRideshareApp(id) {
        setRideshareApp(id);
        try { localStorage.setItem(LS_RIDE_KEY, id); } catch {}
    }

    function handleSignOut() {
        logout();
        navigate(createPageUrl('Home'));
    }

    if (!isAuthenticated) return null;

    return (
        <div className="min-h-screen bg-secondary/50 font-sans antialiased">
            {/* Header */}
            <header className="bg-card border-b border-border sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-4 sm:gap-6">
                        <Link to={createPageUrl('Home')} className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                <Plane className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <span className="font-bold text-lg text-foreground">AirBridge</span>
                        </Link>
                        <nav className="hidden md:flex items-center gap-1 text-sm">
                            <Link to="/search" className="text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg transition-colors">Search</Link>
                            <Link to={createPageUrl('Trips')} className="text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg transition-colors">My Trip</Link>
                            <span className="text-foreground font-semibold px-3 py-1.5 bg-secondary rounded-lg">Settings</span>
                        </nav>
                    </div>
                    <div className="flex items-center gap-2">
                        {saveStatus === 'saving' && (
                            <span className="text-xs text-muted-foreground">Saving...</span>
                        )}
                        {saveStatus === 'saved' && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                <Check className="w-3 h-3" />
                                Saved
                            </span>
                        )}
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Page title */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        type="button"
                        onClick={() => {
                            // Prefer actual back navigation when there's history;
                            // otherwise land on the home surface (`/`).
                            if (window.history.length > 1) navigate(-1);
                            else navigate('/');
                        }}
                        aria-label="Back"
                        className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-black text-foreground tracking-tight">Settings</h1>
                        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
                    </div>
                    <Link to={createPageUrl('Home')} className="md:hidden w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-all" title="Home">
                        <Plane className="w-4 h-4" />
                    </Link>
                </div>

                {loadingProfile ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* ── ACCOUNT ── */}
                        <SectionCard title="Account" icon={User}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-foreground">{display_name || 'Traveler'}</p>
                                    <p className="text-xs text-muted-foreground">Display name</p>
                                </div>
                            </div>
                            {email && (
                                <>
                                    <div className="border-t border-border" />
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-4 h-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium text-foreground">{email}</p>
                                                <p className="text-xs text-muted-foreground">Email</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                            {auth_provider && (
                                <>
                                    <div className="border-t border-border" />
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground">Signed in with</p>
                                        <ProviderBadge provider={auth_provider} />
                                    </div>
                                </>
                            )}
                            <div className="border-t border-border" />
                            <Link to={createPageUrl('Trips')}
                                className="flex items-center justify-between text-sm font-medium text-foreground hover:text-primary transition-colors">
                                <span className="flex items-center gap-2">
                                    <History className="w-4 h-4 text-muted-foreground" />
                                    Trip history
                                </span>
                                <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
                            </Link>
                            <div className="border-t border-border" />
                            <button onClick={handleSignOut}
                                className="flex items-center gap-2 text-sm font-medium text-destructive hover:text-destructive/80 transition-colors">
                                <LogOut className="w-4 h-4" />
                                Sign out
                            </button>
                        </SectionCard>

                        {/* ── DEFAULT PREFERENCES ── */}
                        <SectionCard title="Default Preferences" icon={SettingsIcon}>
                            {/* Transport */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-2 block">Transport mode</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {TRANSPORT_OPTIONS.map(opt => {
                                        const isActive = transport === opt.id;
                                        return (
                                            <button key={opt.id} onClick={() => setTransport(opt.id)}
                                                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                                                    isActive
                                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                        : 'bg-secondary text-foreground/70 border-border hover:border-muted-foreground/30'
                                                }`}>
                                                <opt.icon className="w-4 h-4" />
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="border-t border-border" />

                            {/* Security */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-2 block">Security access</label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'none', label: 'Standard', active: isNoneSecurity },
                                        { id: 'precheck', label: 'PreCheck', active: hasPrecheck && !hasClear },
                                        { id: 'clear', label: 'CLEAR', active: hasClear && !hasPrecheck },
                                        { id: 'clear_precheck', label: 'PreCheck + CLEAR', active: hasPrecheck && hasClear },
                                        { id: 'priority', label: 'Priority Lane (Airline)', active: hasPriorityLane, subtitle: 'First/Business or elite status' },
                                    ].map(chip => (
                                        <button key={chip.id} onClick={() => handleSecurityChip(chip.id)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                                chip.active
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'bg-secondary text-foreground/70 border-border hover:border-muted-foreground/30'
                                            }`}
                                            title={chip.subtitle || ''}>
                                            <ShieldCheck className="w-3 h-3" />
                                            {chip.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-border" />

                            {/* Boarding pass */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Smartphone className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Boarding Pass</p>
                                        <p className="text-xs text-muted-foreground">Default to having boarding pass</p>
                                    </div>
                                </div>
                                <Switch checked={hasBoardingPass} onCheckedChange={setHasBoardingPass} />
                            </div>

                            {/* Children */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Baby className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Traveling with children</p>
                                        <p className="text-xs text-muted-foreground">Adjusts walking pace at the airport</p>
                                    </div>
                                </div>
                                <Switch checked={withChildren} onCheckedChange={setWithChildren} />
                            </div>

                            <div className="border-t border-border" />

                            {/* Gate buffer */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-2 block">Gate buffer</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {BUFFER_PRESETS.map(preset => {
                                        const isActive = gateTime === preset.value;
                                        return (
                                            <button key={preset.value} onClick={() => setGateTime(preset.value)}
                                                className={`py-2.5 px-2 rounded-xl text-sm font-medium border transition-all text-center ${
                                                    isActive
                                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                        : 'bg-secondary text-foreground/70 border-border hover:border-muted-foreground/30'
                                                }`}>
                                                {preset.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </SectionCard>

                        {/* ── PREFERRED APPS ── */}
                        <SectionCard title="Preferred Apps" icon={ExternalLink}>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-2 block">Navigation app</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {NAV_APP_OPTIONS.map(opt => {
                                        const isActive = navApp === opt.id;
                                        return (
                                            <button key={opt.id} onClick={() => handleNavApp(opt.id)}
                                                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                                                    isActive
                                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                        : 'bg-secondary text-foreground/70 border-border hover:border-muted-foreground/30'
                                                }`}>
                                                <opt.icon className="w-3.5 h-3.5" />
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="border-t border-border" />

                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-2 block">Rideshare app</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {RIDESHARE_APP_OPTIONS.map(opt => {
                                        const isActive = rideshareApp === opt.id;
                                        return (
                                            <button key={opt.id} onClick={() => handleRideshareApp(opt.id)}
                                                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                                                    isActive
                                                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                        : 'bg-secondary text-foreground/70 border-border hover:border-muted-foreground/30'
                                                }`}>
                                                <opt.icon className="w-3.5 h-3.5" />
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </SectionCard>

                        {/* ── NOTIFICATIONS ── */}
                        <SectionCard title="Notifications" icon={Bell}>
                            <div className={`flex items-center justify-between ${isTrialExpired ? 'opacity-50' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <Bell className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Leave-by time changes</p>
                                        <p className="text-xs text-muted-foreground">Alert when traffic or delays shift your departure time</p>
                                        {isTrialExpired && <p className="text-xs text-muted-foreground/60 mt-0.5">Requires AirBridge Pro</p>}
                                    </div>
                                </div>
                                <Switch checked={notifPrefs.leave_time} onCheckedChange={v => setNotif('leave_time', v)} disabled={isTrialExpired} />
                            </div>

                            <div className={`flex items-center justify-between ${isTrialExpired ? 'opacity-50' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Flight delays & cancellations</p>
                                        <p className="text-xs text-muted-foreground">Alert when your flight status changes</p>
                                        {isTrialExpired && <p className="text-xs text-muted-foreground/60 mt-0.5">Requires AirBridge Pro</p>}
                                    </div>
                                </div>
                                <Switch checked={notifPrefs.delays} onCheckedChange={v => setNotif('delays', v)} disabled={isTrialExpired} />
                            </div>

                            <div className={`flex items-center justify-between ${isTrialExpired ? 'opacity-50' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Time to go!</p>
                                        <p className="text-xs text-muted-foreground">Final nudge when it's time to leave</p>
                                        {isTrialExpired && <p className="text-xs text-muted-foreground/60 mt-0.5">Requires AirBridge Pro</p>}
                                    </div>
                                </div>
                                <Switch checked={notifPrefs.time_to_go} onCheckedChange={v => setNotif('time_to_go', v)} disabled={isTrialExpired} />
                            </div>

                            <div className="border-t border-border" />

                            <div className={`flex items-center justify-between ${!isPro ? 'opacity-50' : ''}`} title={!isPro ? 'Pro feature' : ''}>
                                <div className="flex items-center gap-3">
                                    <Navigation className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            Gate changes
                                            {!isSubscribed && <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground">Pro</span>}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Alert when your gate assignment changes</p>
                                    </div>
                                </div>
                                <Switch checked={notifPrefs.gate_change} onCheckedChange={v => setNotif('gate_change', v)} disabled={!isPro} />
                            </div>

                            <div className={`flex items-center justify-between ${isTrialExpired ? 'opacity-50' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            Trip summary
                                            {!isSubscribed && <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground">Pro</span>}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Post-flight accuracy report</p>
                                    </div>
                                </div>
                                <Switch checked={notifPrefs.trip_summary} onCheckedChange={v => setNotif('trip_summary', v)} disabled={isTrialExpired} />
                            </div>

                            <div className="border-t border-border" />
                            <p className="text-xs text-muted-foreground/60">
                                {isTrialExpired
                                    ? 'Upgrade to Pro to enable notifications'
                                    : 'Notifications require the AirBridge app. Coming soon.'}
                            </p>
                        </SectionCard>

                        {/* ── SUBSCRIPTION ── */}
                        <SectionCard title="Subscription" icon={CreditCard}>
                            {loadingSub && (
                                <p className="text-xs text-muted-foreground">Loading subscription…</p>
                            )}

                            {!loadingSub && isTrialActive && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-foreground">
                                                {trialRemaining === 3 ? '3 Pro trips available' : `Trip ${3 - trialRemaining} of 3`}
                                            </p>
                                            <p className="text-xs text-primary font-medium mt-0.5">
                                                {trialRemaining === 3
                                                    ? 'Start your first trip to begin'
                                                    : `You have ${trialRemaining} Pro trip${trialRemaining === 1 ? '' : 's'} remaining`}
                                            </p>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary text-primary-foreground">
                                            Pro Trial
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className={`h-2 rounded-full transition-all ${
                                                i <= (3 - trialRemaining) ? 'bg-primary' : 'bg-secondary'
                                            }`} />
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Enjoy the full AirBridge experience
                                    </p>
                                </>
                            )}

                            {!loadingSub && isTrialActive && (
                                <button
                                    onClick={() => setPaywallOpen(true)}
                                    className="w-full py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                >
                                    Upgrade to Pro — $4.99/mo
                                </button>
                            )}

                            {!loadingSub && isTrialExpired && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Free Plan</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">3 of 3 Pro trips used</p>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-accent text-primary">
                                            Free Plan
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => setPaywallOpen(true)}
                                        className="w-full py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                    >
                                        Upgrade to Pro — $4.99/mo
                                    </button>
                                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                                        <li className="flex items-center gap-2"><Clock className="w-3 h-3" />Live lock screen countdown</li>
                                        <li className="flex items-center gap-2"><Bell className="w-3 h-3" />Spoken &ldquo;Time to go!&rdquo; alerts</li>
                                        <li className="flex items-center gap-2"><Navigation className="w-3 h-3" />Gate change notifications</li>
                                        <li className="flex items-center gap-2"><FileText className="w-3 h-3" />Full trip history &amp; accuracy stats</li>
                                    </ul>
                                </>
                            )}

                            {!loadingSub && isSubscribed && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Pro Plan</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {subStatus?.current_period_end
                                                    ? `Renews ${new Date(subStatus.current_period_end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                                                    : 'Active subscription'}
                                            </p>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary text-primary-foreground">
                                            Pro Plan
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleManageSubscription}
                                        disabled={openingPortal}
                                        className="text-sm font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-60"
                                    >
                                        {openingPortal ? 'Opening…' : 'Manage subscription'}
                                    </button>
                                    {portalError && (
                                        <p className="text-xs text-destructive">{portalError}</p>
                                    )}
                                </>
                            )}
                        </SectionCard>

                        {/* ── ABOUT ── */}
                        <SectionCard title="About" icon={Info}>
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">App version</p>
                                <p className="text-sm font-medium text-foreground">0.1.0-beta</p>
                            </div>
                            <div className="border-t border-border" />
                            <a href="mailto:feedback@airbridge.live"
                                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                                Send feedback
                            </a>
                            <div className="border-t border-border" />
                            <a href="#" onClick={(e) => e.preventDefault()}
                                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                                Privacy policy
                            </a>
                        </SectionCard>
                    </>
                )}
            </div>

            <PaywallModal
                open={paywallOpen}
                onOpenChange={setPaywallOpen}
                token={token}
            />
        </div>
    );
}
