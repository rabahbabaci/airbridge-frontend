import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { API_BASE } from '@/config';
import PaywallModal from '@/components/PaywallModal';
import AuthModal from '@/components/engine/AuthModal';
import useAuthGatedTabs from '@/hooks/useAuthGatedTabs';
import TabBar from '@/components/design-system/TabBar';
import TabScreenHeader from '@/components/TabScreenHeader';
import Card from '@/components/design-system/Card';
import ListRow from '@/components/design-system/ListRow';
import StatusPill from '@/components/design-system/StatusPill';
import Button from '@/components/design-system/Button';
import Sheet from '@/components/design-system/Sheet';
import Switch from '@/components/design-system/Switch';
import pkg from '../../package.json';
import {
    Airplane, MagnifyingGlass, Gear, User, Envelope,
    Shield, ShieldCheck, SuitcaseRolling, Baby, Bell, Info,
    Car, SteeringWheel, Train, MapTrifold, NavigationArrow, Compass,
    SignOut, Check, Trash, ClockCounterClockwise, ChatCircle,
    FileText, Lock, WarningCircle,
} from '@phosphor-icons/react';

/* ── Option sets ────────────────────────────────────────────────────────── */

// Transport cards mirror StepDepartureSetup.jsx (brief §4.4): three
// options, provider pick (Uber vs Lyft) surfaces later in Results and
// via the Preferred Apps row below. 'train' is also the backend value
// for transit (Bay Area BART/rail tilt).
const TRANSPORT_CARDS = [
    { value: 'rideshare', label: 'Rideshare',     subtitle: 'Uber, Lyft, etc.', Icon: Car },
    { value: 'driving',   label: 'Drive',         subtitle: '+~10 min parking', Icon: SteeringWheel },
    { value: 'train',     label: 'Public transit', subtitle: 'Bus, BART, rail', Icon: Train },
];

// Security access ladder — mirrors StepDepartureSetup.jsx:69-74 verbatim.
// Settings and Setup must stay in lockstep so a user's Setup choice
// round-trips through Settings without a silent downgrade (see commit
// that introduced this alignment for the lossy-round-trip bug context).
// priority_lane is intentionally excluded here — Setup excludes it too
// per brief §4.4 ("too airline-specific, hard to model"). The backend
// enum still supports it, so data shaped before this UI existed
// round-trips; it just isn't user-selectable.
const SECURITY_OPTIONS = [
    { value: 'none',           title: 'None',             subtitle: 'Standard security lane' },
    { value: 'precheck',       title: 'TSA PreCheck',     subtitle: 'Dedicated fast lane',    badge: 'Saves ~15 min' },
    { value: 'clear',          title: 'CLEAR',            subtitle: 'Biometric fast lane',    badge: 'Saves ~15 min' },
    { value: 'clear_precheck', title: 'PreCheck + CLEAR', subtitle: 'Fastest combined lane',  badge: 'Saves ~20 min' },
];

const SECURITY_VALUES = new Set(SECURITY_OPTIONS.map(o => o.value));

const BUFFER_OPTIONS = [
    { value: 15, label: 'Tight · 15 min' },
    { value: 30, label: 'Comfortable · 30 min' },
    { value: 60, label: 'Relaxed · 60 min' },
];

const RIDESHARE_OPTIONS = [
    { value: 'uber', label: 'Uber', Icon: Car },
    { value: 'lyft', label: 'Lyft', Icon: Car },
];

const NAV_APP_OPTIONS = [
    { value: 'apple_maps', label: 'Apple Maps', Icon: MapTrifold },
    { value: 'google_maps', label: 'Google Maps', Icon: NavigationArrow },
    { value: 'waze', label: 'Waze', Icon: Compass },
];

const LS_NAV_KEY = 'airbridge_preferred_nav';
const LS_RIDE_KEY = 'airbridge_preferred_rideshare';
const LS_NOTIF_KEY = 'airbridge_notification_prefs';
const LS_CHECKING_BAGS_KEY = 'airbridge_checking_bags';

const NOTIF_DEFAULTS = {
    leave_by: true,
    flight_status: true,
    tsa_wait: true,
    sms_escalation: false,
};

function loadLocalPref(key, fallback) {
    try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}

function formatProvider(p) {
    if (p === 'google') return 'Google';
    if (p === 'apple') return 'Apple';
    if (p === 'phone') return 'Phone';
    return p || 'Unknown';
}

/* ── Option grid — pill-style button set used for transport / rideshare / nav ── */

function OptionGrid({ options, value, onChange, cols = 4 }) {
    const colClass = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }[cols] || 'grid-cols-4';
    return (
        <div className={`grid ${colClass} gap-c-2`}>
            {options.map(opt => {
                const active = opt.value === value;
                const Icon = opt.Icon;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={`flex items-center justify-center gap-c-1 h-11 px-c-3 rounded-c-sm c-type-footnote font-semibold transition-colors duration-c-fast ${
                            active
                                ? 'bg-c-brand-primary text-c-text-inverse'
                                : 'bg-c-ground-sunken text-c-text-secondary hover:text-c-text-primary'
                        }`}
                    >
                        {Icon && <Icon size={16} weight={active ? 'bold' : 'regular'} />}
                        <span>{opt.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

/* ── Toggle row — reused across Default Preferences + Notifications ─────── */

function ToggleRow({ icon: Icon, primary, secondary, checked, onChange, disabled, rightBadge }) {
    return (
        <div className={`flex items-center gap-c-3 px-c-4 py-c-3 min-h-[44px] ${disabled ? 'opacity-50' : ''}`}>
            {Icon && (
                <div className="shrink-0 w-9 h-9 flex items-center justify-center text-c-text-secondary">
                    <Icon size={20} weight="regular" />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-c-2">
                    <span className="c-type-headline text-c-text-primary truncate">{primary}</span>
                    {rightBadge}
                </div>
                {secondary && (
                    <div className="c-type-footnote text-c-text-secondary mt-0.5">{secondary}</div>
                )}
            </div>
            <Switch
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                ariaLabel={primary}
            />
        </div>
    );
}

/* ── Section header — inline JSX, no DS primitive ──────────────────────── */

function SectionLabel({ children }) {
    return (
        <h2 className="c-type-caption text-c-text-tertiary px-c-4 pb-c-2 pt-c-6">{children}</h2>
    );
}

/* ── Security option card — structural mirror of StepDepartureSetup.jsx's
     local SecurityOption (lines 490–524). Keep visually identical so a
     user perceives the Settings and Setup controls as the same surface.
     If either page restyles, update both — or lift this to a shared DS
     primitive. */

function SecurityOption({ active, onClick, title, subtitle, badge }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`w-full flex items-center gap-c-3 md:flex-col md:items-start md:gap-c-2 p-c-4 rounded-c-md border transition-colors text-left md:min-h-[148px] focus:outline-none focus-visible:ring-2 focus-visible:ring-c-brand-primary focus-visible:ring-offset-2 ${
                active
                    ? 'bg-c-brand-primary-surface border-c-brand-primary'
                    : 'bg-c-ground-elevated border-c-border-hairline hover:border-c-border-strong'
            }`}
        >
            <Shield
                size={22}
                weight={active ? 'fill' : 'regular'}
                className={`shrink-0 ${active ? 'text-c-brand-primary' : 'text-c-text-secondary'}`}
            />
            <div className="flex-1 md:flex-none md:w-full min-w-0">
                <p className={`c-type-body font-semibold ${active ? 'text-c-brand-primary' : 'text-c-text-primary'}`}>
                    {title}
                </p>
                <p className="c-type-footnote text-c-text-secondary">{subtitle}</p>
            </div>
            {badge && (
                <span className="shrink-0 md:mt-auto inline-flex items-center px-c-2 py-c-1 rounded-c-pill bg-c-confidence-surface text-c-confidence c-type-footnote font-semibold">
                    {badge}
                </span>
            )}
        </button>
    );
}

/* ── Sign-out confirmation sheet ────────────────────────────────────────── */

function SignOutSheet({ open, onClose, onConfirm }) {
    return (
        <Sheet open={open} onClose={onClose} title="Sign out?" placement="center">
            <p className="c-type-body text-c-text-secondary">
                You&rsquo;ll need to sign in again to track trips and get notifications.
            </p>
            <div className="mt-c-6 flex items-center gap-c-3">
                <Button variant="secondary" onClick={onClose} className="flex-1">
                    Cancel
                </Button>
                <Button variant="destructive" onClick={onConfirm} className="flex-1">
                    Sign out
                </Button>
            </div>
        </Sheet>
    );
}

/* ── Settings page ──────────────────────────────────────────────────────── */

export default function Settings() {
    const navigate = useNavigate();
    const {
        token, isAuthenticated, display_name, auth_provider, logout,
        trip_count, subStatus, isPro, refreshSubscriptionStatus,
    } = useAuth();
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    const { handleTabChange, authOpen, setAuthOpen, handleAuthSuccess } = useAuthGatedTabs('settings');

    const tabs = [
        { value: 'search', label: 'Search', icon: <MagnifyingGlass size={26} weight="regular" />, iconActive: <MagnifyingGlass size={26} weight="bold" /> },
        { value: 'trip', label: 'My Trip', icon: <Airplane size={26} weight="regular" />, iconActive: <Airplane size={26} weight="bold" /> },
        { value: 'settings', label: 'Settings', icon: <Gear size={26} weight="regular" />, iconActive: <Gear size={26} weight="bold" /> },
    ];

    // Redirect unauthenticated users to Search
    useEffect(() => {
        if (!isAuthenticated) navigate(createPageUrl('Home'), { replace: true });
    }, [isAuthenticated, navigate]);

    // ── Profile + server-persisted preferences ──────────────────────────
    const [email, setEmail] = useState('');
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const [transport, setTransport] = useState('rideshare');
    const [security, setSecurity] = useState('none'); // 'precheck' | 'none'
    const [hasBoardingPass, setHasBoardingPass] = useState(true);
    const [withChildren, setWithChildren] = useState(false);
    const [gateTime, setGateTime] = useState(30);

    // ── Local-only prefs (persist in localStorage for v1) ───────────────
    // TODO: persist server-side once backend accepts these keys.
    const [navApp, setNavApp] = useState(() => loadLocalPref(LS_NAV_KEY, 'apple_maps'));
    const [rideshareApp, setRideshareApp] = useState(() => loadLocalPref(LS_RIDE_KEY, 'uber'));
    // 'checking_bags' is a Settings-only toggle — Setup has a bag-count
    // stepper and a separate boarding-pass toggle. The old has_boarding_pass
    // backend field is still persisted on save (unchanged) but no longer
    // has a Settings UI control. Orphan localStorage keys left intact.
    // TODO: persist server-side once backend accepts this key.
    const [checkingBags, setCheckingBags] = useState(() => {
        try { return localStorage.getItem(LS_CHECKING_BAGS_KEY) === '1'; }
        catch { return false; }
    });

    // ── Notification prefs (local-only for v1) ──────────────────────────
    // TODO: persist server-side once backend accepts these keys.
    const [notifPrefs, setNotifPrefs] = useState(() => {
        try {
            const raw = localStorage.getItem(LS_NOTIF_KEY);
            return raw ? { ...NOTIF_DEFAULTS, ...JSON.parse(raw) } : NOTIF_DEFAULTS;
        } catch { return NOTIF_DEFAULTS; }
    });
    const setNotif = (key, value) => {
        setNotifPrefs(prev => {
            const next = { ...prev, [key]: value };
            // TODO: persist server-side once backend accepts these keys.
            try { localStorage.setItem(LS_NOTIF_KEY, JSON.stringify(next)); } catch { /* ignore */ }
            return next;
        });
    };

    // ── Save status (inline toast) ──────────────────────────────────────
    const [saveStatus, setSaveStatus] = useState(null); // 'saving' | 'saved' | 'error'
    const saveTimerRef = useRef(null);
    const debounceRef = useRef(null);

    // ── Subscription management ────────────────────────────────────────
    // "Manage subscription" CTA (Stripe Customer Portal) is temporarily
    // removed from the Pro variant pending portal configuration on Stripe's
    // side. Backend /v1/subscriptions/portal endpoint stays live for when
    // we re-enable. Sprint 8 backlog restores it.
    const [paywallOpen, setPaywallOpen] = useState(false);
    const [signOutOpen, setSignOutOpen] = useState(false);

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
        if (params.get('subscription') !== 'success') return;

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
                const res = await fetch(`${API_BASE}/v1/users/me`, { headers: authHeaders });
                if (!res.ok) throw new Error(`Profile load failed (${res.status})`);
                const data = await res.json();
                setEmail(data.email || '');
                const p = data.preferences || {};
                if (p.transport_mode) setTransport(p.transport_mode);
                if (p.has_boarding_pass != null) setHasBoardingPass(p.has_boarding_pass);
                if (p.traveling_with_children != null) setWithChildren(p.traveling_with_children);
                if (p.gate_time_minutes != null) setGateTime(p.gate_time_minutes);
                // Accept any of the 4 valid security_access values directly.
                // priority_lane (still in the backend enum but not user-selectable
                // here) and any unknown value fall back to 'none'.
                setSecurity(SECURITY_VALUES.has(p.security_access) ? p.security_access : 'none');
                setLoadError(false);
            } catch (err) {
                console.error('Failed to load profile:', err);
                setLoadError(true);
            } finally {
                setLoadingProfile(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // ── Save preferences to backend ──
    const savePreferences = useCallback(async () => {
        if (!token) return;
        setSaveStatus('saving');
        try {
            const res = await fetch(`${API_BASE}/v1/users/preferences`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    transport_mode: transport,
                    security_access: security,
                    has_boarding_pass: hasBoardingPass,
                    traveling_with_children: withChildren,
                    gate_time_minutes: gateTime,
                }),
            });
            if (!res.ok) throw new Error(`Save failed (${res.status})`);
            setSaveStatus('saved');
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(() => setSaveStatus(null), 2000);
        } catch (err) {
            console.error('Failed to save preferences:', err);
            setSaveStatus('error');
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(() => setSaveStatus(null), 3000);
        }
    }, [token, transport, security, hasBoardingPass, withChildren, gateTime]);

    // Debounced save on preference change
    const initialLoadDone = useRef(false);
    useEffect(() => {
        if (loadingProfile) return;
        if (!initialLoadDone.current) { initialLoadDone.current = true; return; }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(savePreferences, 600);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [transport, security, hasBoardingPass, withChildren, gateTime, savePreferences, loadingProfile]);

    // ── Local pref handlers ──
    const handleNavApp = (v) => {
        setNavApp(v);
        // TODO: persist server-side once backend accepts this key.
        try { localStorage.setItem(LS_NAV_KEY, v); } catch { /* ignore */ }
    };
    const handleRideshareApp = (v) => {
        setRideshareApp(v);
        // TODO: persist server-side once backend accepts this key.
        try { localStorage.setItem(LS_RIDE_KEY, v); } catch { /* ignore */ }
    };

    const handleSignOut = () => {
        setSignOutOpen(false);
        logout();
        navigate(createPageUrl('Home'));
    };

    const handleDeleteAccount = () => {
        // TODO: route to /settings/delete once confirmation screen (F7.8) ships.
        // eslint-disable-next-line no-console
        console.log('TODO: route to /settings/delete');
    };

    const handleCheckingBags = (v) => {
        setCheckingBags(v);
        // TODO: persist server-side once backend accepts this key.
        try { localStorage.setItem(LS_CHECKING_BAGS_KEY, v ? '1' : '0'); }
        catch { /* ignore */ }
    };

    if (!isAuthenticated) return null;

    const avatarInitial = (display_name || email || '?').charAt(0).toUpperCase();

    return (
        <div className="min-h-screen bg-c-ground font-c-sans text-c-text-primary pb-28">
            {/* Shared identity header — consistent with Search and My Trip
               tabs per real-device-findings-2 alignment pass. Brief §4.14's
               "Settings title left, no right icon" is superseded by this
               identity treatment; brief to be updated post-pitch. */}
            <TabScreenHeader onSignInClick={() => setAuthOpen(true)} />

            {/* Inline save-status toast — confidence tone, fades via state
               timeout. Top offset = safe-area + 56px TopBar height + 12px
               breathing room; matches TopBar's own pt-[calc(...)] formula. */}
            <div
                className={`sticky top-[calc(env(safe-area-inset-top)_+_68px)] z-30 px-c-4 pt-c-3 transition-opacity duration-c-normal ${
                    saveStatus ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                aria-live="polite"
            >
                <div className="max-w-3xl mx-auto flex justify-center">
                    {saveStatus === 'saving' && (
                        <StatusPill tone="neutral">Saving…</StatusPill>
                    )}
                    {saveStatus === 'saved' && (
                        <StatusPill tone="confidence" dot>Saved</StatusPill>
                    )}
                    {saveStatus === 'error' && (
                        <StatusPill tone="urgency" dot>Save failed — retrying next change</StatusPill>
                    )}
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-c-4 pt-c-4 pb-c-10">
                {/* Visible "Settings" page title removed per
                   real-device-findings-2 — the shared TabScreenHeader +
                   active tab in the TabBar convey location. Preserving as
                   sr-only so screen readers still announce the screen. */}
                <h1 className="sr-only">Settings</h1>

                {loadingProfile ? (
                    <div className="flex items-center justify-center py-c-16">
                        <div className="w-6 h-6 border-2 border-c-border-subtle border-t-c-text-secondary rounded-full animate-spin" />
                    </div>
                ) : loadError ? (
                    <Card padding="md" className="mt-c-6">
                        <div className="flex items-center gap-c-3">
                            <WarningCircle size={20} weight="bold" className="text-c-urgency shrink-0" />
                            <div className="flex-1">
                                <p className="c-type-headline text-c-text-primary">Couldn&rsquo;t load your profile</p>
                                <p className="c-type-footnote text-c-text-secondary mt-0.5">Check your connection and try again.</p>
                            </div>
                            <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
                                Retry
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <>
                        {/* ── ACCOUNT ── */}
                        <SectionLabel>Account</SectionLabel>
                        <Card padding="none" className="overflow-hidden">
                            <div className="divide-y divide-c-border-hairline">
                                <div className="flex items-center gap-c-3 px-c-4 py-c-3 min-h-[44px]">
                                    <div className="shrink-0 w-9 h-9 rounded-c-pill bg-c-brand-primary text-c-text-inverse c-type-headline flex items-center justify-center">
                                        {avatarInitial}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="c-type-headline text-c-text-primary truncate">
                                            {display_name || 'Traveler'}
                                        </div>
                                        <div className="c-type-footnote text-c-text-secondary">Display name</div>
                                    </div>
                                </div>
                                {email && (
                                    <ListRow
                                        leftIcon={<Envelope size={20} weight="regular" />}
                                        primary={email}
                                        secondary="Email"
                                    />
                                )}
                                {auth_provider && (
                                    <ListRow
                                        leftIcon={<User size={20} weight="regular" />}
                                        primary="Signed in with"
                                        right={
                                            <StatusPill tone="neutral">{formatProvider(auth_provider)}</StatusPill>
                                        }
                                    />
                                )}
                                <ListRow
                                    leftIcon={<ClockCounterClockwise size={20} weight="regular" />}
                                    primary="Trip history"
                                    chevron
                                    onClick={() => navigate(createPageUrl('Trips'))}
                                />
                                <ListRow
                                    leftIcon={<SignOut size={20} weight="regular" className="text-c-urgency" />}
                                    primary={<span className="text-c-urgency">Sign out</span>}
                                    onClick={() => setSignOutOpen(true)}
                                />
                            </div>
                        </Card>

                        {/* ── SUBSCRIPTION ── */}
                        <SectionLabel>Subscription</SectionLabel>
                        <SubscriptionCard
                            loadingSub={loadingSub}
                            isTrialActive={isTrialActive}
                            isTrialExpired={isTrialExpired}
                            isSubscribed={isSubscribed}
                            trialRemaining={trialRemaining}
                            subStatus={subStatus}
                            onUpgrade={() => setPaywallOpen(true)}
                        />

                        {/* ── DEFAULT PREFERENCES ── */}
                        <SectionLabel>Default Preferences</SectionLabel>
                        <Card padding="md" className="space-y-c-5">
                            <div>
                                <label className="c-type-footnote font-semibold text-c-text-secondary block pb-c-2">Transport mode</label>
                                {/* Card grid mirrors StepDepartureSetup.jsx:
                                    3 options (Rideshare / Drive / Public transit),
                                    same icons, labels, subtexts. Selected card
                                    gets brand-tinted bg + brand border. */}
                                <div className="grid grid-cols-3 gap-c-3">
                                    {TRANSPORT_CARDS.map((card) => {
                                        const active = transport === card.value;
                                        const Icon = card.Icon;
                                        return (
                                            <button
                                                key={card.value}
                                                type="button"
                                                onClick={() => setTransport(card.value)}
                                                aria-pressed={active}
                                                className={`flex flex-col items-start gap-c-2 p-c-3 rounded-c-md border transition-colors duration-c-fast text-left min-h-[104px] focus:outline-none focus-visible:ring-2 focus-visible:ring-c-brand-primary ${
                                                    active
                                                        ? 'bg-c-brand-primary-surface border-c-brand-primary'
                                                        : 'bg-c-ground-elevated border-c-border-hairline hover:border-c-border-strong'
                                                }`}
                                            >
                                                <Icon
                                                    size={22}
                                                    weight={active ? 'fill' : 'regular'}
                                                    className={active ? 'text-c-brand-primary' : 'text-c-text-secondary'}
                                                />
                                                <div className="min-w-0">
                                                    <p className={`c-type-body font-semibold ${active ? 'text-c-brand-primary' : 'text-c-text-primary'}`}>
                                                        {card.label}
                                                    </p>
                                                    <p className="c-type-footnote text-c-text-secondary">
                                                        {card.subtitle}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="c-type-footnote font-semibold text-c-text-secondary block pb-c-2">Security access</label>
                                {/* Grid + SecurityOption shape mirrors Setup
                                    (StepDepartureSetup.jsx:394-408): stacked
                                    on mobile, 4-col row on ≥768px. */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-c-3">
                                    {SECURITY_OPTIONS.map((opt) => (
                                        <SecurityOption
                                            key={opt.value}
                                            active={security === opt.value}
                                            onClick={() => setSecurity(opt.value)}
                                            title={opt.title}
                                            subtitle={opt.subtitle}
                                            badge={opt.badge}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="c-type-footnote font-semibold text-c-text-secondary block pb-c-2">Buffer time</label>
                                <div className="grid grid-cols-3 gap-c-2">
                                    {BUFFER_OPTIONS.map(opt => {
                                        const active = gateTime === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setGateTime(opt.value)}
                                                className={`h-11 px-c-2 rounded-c-sm c-type-footnote font-semibold transition-colors duration-c-fast ${
                                                    active
                                                        ? 'bg-c-brand-primary text-c-text-inverse'
                                                        : 'bg-c-ground-sunken text-c-text-secondary hover:text-c-text-primary'
                                                }`}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="c-type-footnote font-semibold text-c-text-secondary block pb-c-2">Preferred rideshare</label>
                                <OptionGrid options={RIDESHARE_OPTIONS} value={rideshareApp} onChange={handleRideshareApp} cols={2} />
                            </div>

                            <div>
                                <label className="c-type-footnote font-semibold text-c-text-secondary block pb-c-2">Preferred nav app</label>
                                <OptionGrid options={NAV_APP_OPTIONS} value={navApp} onChange={handleNavApp} cols={3} />
                            </div>

                            <div className="-mx-c-4 border-t border-c-border-hairline">
                                <ToggleRow
                                    icon={SuitcaseRolling}
                                    primary="Checking bags?"
                                    secondary="Joining the check-in line · Wait time varies"
                                    checked={checkingBags}
                                    onChange={handleCheckingBags}
                                />
                                <ToggleRow
                                    icon={Baby}
                                    primary="Traveling with children"
                                    secondary="Adjusts walking pace at airport"
                                    checked={withChildren}
                                    onChange={setWithChildren}
                                />
                            </div>
                        </Card>

                        {/* ── NOTIFICATIONS ── */}
                        <SectionLabel>Notifications</SectionLabel>
                        <Card padding="none" className="overflow-hidden">
                            <div className="divide-y divide-c-border-hairline">
                                <ToggleRow
                                    icon={Bell}
                                    primary="Leave-by reminders"
                                    secondary="Alerted when it's time to leave, and if traffic changes your departure time"
                                    checked={notifPrefs.leave_by}
                                    onChange={v => setNotif('leave_by', v)}
                                />
                                <ToggleRow
                                    icon={Airplane}
                                    primary="Flight status updates"
                                    secondary="Instant alerts for delays, cancellations, and gate changes"
                                    checked={notifPrefs.flight_status}
                                    onChange={v => setNotif('flight_status', v)}
                                />
                                <ToggleRow
                                    icon={ShieldCheck}
                                    primary="TSA wait spikes"
                                    secondary="Notified if security lines grow beyond your buffer"
                                    checked={notifPrefs.tsa_wait}
                                    onChange={v => setNotif('tsa_wait', v)}
                                />
                                <ToggleRow
                                    icon={ChatCircle}
                                    primary="SMS escalation"
                                    secondary="Text if you miss the Time to go push"
                                    checked={notifPrefs.sms_escalation && isPro}
                                    onChange={v => setNotif('sms_escalation', v)}
                                    disabled={!isPro}
                                    rightBadge={!isPro && (
                                        <span className="inline-flex items-center gap-c-1 c-type-caption text-c-brand-primary">
                                            <Lock size={10} weight="bold" />
                                            Pro
                                        </span>
                                    )}
                                />
                            </div>
                            <div className="px-c-4 py-c-3 border-t border-c-border-hairline">
                                <p className="c-type-footnote text-c-text-tertiary">
                                    Notifications require the AirBridge app. Coming soon.
                                </p>
                            </div>
                        </Card>

                        {/* ── ABOUT ── */}
                        <SectionLabel>About</SectionLabel>
                        <Card padding="none" className="overflow-hidden">
                            <div className="divide-y divide-c-border-hairline">
                                <ListRow
                                    leftIcon={<ChatCircle size={20} weight="regular" />}
                                    primary={<a href="mailto:feedback@airbridge.live" className="block w-full text-c-text-primary">Send feedback</a>}
                                    chevron
                                />
                                <ListRow
                                    leftIcon={<FileText size={20} weight="regular" />}
                                    primary="Privacy policy"
                                    chevron
                                    onClick={() => navigate('/privacy')}
                                />
                                <ListRow
                                    leftIcon={<FileText size={20} weight="regular" />}
                                    primary="Terms of service"
                                    chevron
                                    // TODO: route to /terms once Terms page ships.
                                    onClick={() => { /* eslint-disable-next-line no-console */ console.log('TODO: route to /terms'); }}
                                />
                                <ListRow
                                    leftIcon={<Info size={20} weight="regular" />}
                                    primary="App version"
                                    right={<span className="c-type-footnote text-c-text-tertiary">{pkg.version}</span>}
                                />
                            </div>
                        </Card>

                        {/* ── DANGER ZONE ── */}
                        <SectionLabel>Danger zone</SectionLabel>
                        <Card padding="none" className="overflow-hidden">
                            <ListRow
                                leftIcon={<Trash size={20} weight="regular" className="text-c-urgency" />}
                                primary={<span className="text-c-urgency">Delete account</span>}
                                chevron
                                onClick={handleDeleteAccount}
                            />
                        </Card>
                    </>
                )}
            </main>

            <TabBar value="settings" onChange={handleTabChange} tabs={tabs} />

            <PaywallModal open={paywallOpen} onOpenChange={setPaywallOpen} token={token} />

            <AuthModal open={authOpen} onOpenChange={setAuthOpen} onSuccess={handleAuthSuccess} />

            <SignOutSheet
                open={signOutOpen}
                onClose={() => setSignOutOpen(false)}
                onConfirm={handleSignOut}
            />
        </div>
    );
}

/* ── Subscription card — three states: trial-active / trial-expired / subscribed ── */

function SubscriptionCard({
    loadingSub, isTrialActive, isTrialExpired, isSubscribed,
    trialRemaining, subStatus, onUpgrade,
}) {
    if (loadingSub) {
        return (
            <Card padding="md">
                <p className="c-type-footnote text-c-text-tertiary">Loading subscription…</p>
            </Card>
        );
    }

    if (isTrialActive) {
        const used = 3 - trialRemaining;
        return (
            <Card padding="lg" className="bg-c-brand-primary-surface border-c-brand-primary/20">
                <div className="flex items-start justify-between gap-c-3">
                    <div className="min-w-0">
                        <p className="c-type-title text-c-text-primary">
                            {trialRemaining === 3 ? '3 Pro trips available' : `Trip ${used + 1} of 3`}
                        </p>
                        <p className="c-type-footnote text-c-brand-primary font-semibold mt-0.5">
                            {trialRemaining === 3
                                ? 'Start your first trip to begin'
                                : `${trialRemaining} Pro trip${trialRemaining === 1 ? '' : 's'} remaining`}
                        </p>
                    </div>
                    <StatusPill tone="neutral" className="bg-c-brand-primary text-c-text-inverse">
                        Pro Trial
                    </StatusPill>
                </div>
                <div className="grid grid-cols-3 gap-c-2 mt-c-4">
                    {[1, 2, 3].map(i => (
                        <div
                            key={i}
                            className={`h-2 rounded-c-pill transition-colors ${
                                i <= used ? 'bg-c-brand-primary' : 'bg-c-ground-sunken'
                            }`}
                        />
                    ))}
                </div>
                <div className="mt-c-5">
                    <Button variant="primary" full onClick={onUpgrade}>
                        Upgrade to Pro — $4.99/mo
                    </Button>
                </div>
            </Card>
        );
    }

    if (isTrialExpired) {
        return (
            <Card padding="lg">
                <div className="flex items-start justify-between gap-c-3">
                    <div className="min-w-0">
                        <p className="c-type-headline text-c-text-primary">Free Plan</p>
                        <p className="c-type-footnote text-c-text-secondary mt-0.5">3 of 3 Pro trips used</p>
                    </div>
                    <StatusPill tone="neutral">Free</StatusPill>
                </div>
                <div className="mt-c-4">
                    <Button variant="primary" full onClick={onUpgrade}>
                        Upgrade to Pro — $4.99/mo
                    </Button>
                </div>
                <ul className="mt-c-4 space-y-c-2">
                    <ProFeatureRow icon={Bell} label="Smart leave-by notifications" />
                    <ProFeatureRow icon={Airplane} label="Flight status updates" />
                    <ProFeatureRow icon={ChatCircle} label="SMS escalation if you miss a push" />
                    <ProFeatureRow icon={FileText} label="Full trip history &amp; accuracy stats" />
                </ul>
            </Card>
        );
    }

    if (isSubscribed) {
        return (
            <Card padding="md">
                <div className="flex items-start justify-between gap-c-3">
                    <div className="min-w-0">
                        <p className="c-type-headline text-c-text-primary">Pro Plan</p>
                        <p className="c-type-footnote text-c-text-secondary mt-0.5">
                            {subStatus?.current_period_end
                                ? `Renews ${new Date(subStatus.current_period_end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                                : 'Active subscription'}
                        </p>
                    </div>
                    <StatusPill tone="confidence" dot>Active</StatusPill>
                </div>
                <p className="c-type-footnote text-c-text-tertiary mt-c-3">
                    Manage your subscription in the Stripe billing portal — coming soon
                </p>
            </Card>
        );
    }

    return null;
}

function ProFeatureRow({ icon: Icon, label }) {
    return (
        <li className="flex items-center gap-c-2 c-type-footnote text-c-text-secondary">
            <Check size={14} weight="bold" className="text-c-confidence shrink-0" />
            <Icon size={14} weight="regular" className="text-c-text-tertiary shrink-0" />
            <span>{label}</span>
        </li>
    );
}
