import { useState } from 'react';
import {
    MagnifyingGlass, House, Airplane, Gear, User, Bell, ShieldCheck,
    Car, MapTrifold, Clock, CreditCard, SignOut,
} from '@phosphor-icons/react';
import Button from '@/components/design-system/Button';
import Card from '@/components/design-system/Card';
import ListRow from '@/components/design-system/ListRow';
import StatusPill from '@/components/design-system/StatusPill';
import SegmentedControl from '@/components/design-system/SegmentedControl';
import Input from '@/components/design-system/Input';
import TopBar from '@/components/design-system/TopBar';
import TabBar from '@/components/design-system/TabBar';
import Sheet from '@/components/design-system/Sheet';

/* ── Token tables ────────────────────────────────────────────────────────── */
const COLOR_GROUPS = [
    {
        name: 'Brand', tokens: [
            { name: 'brand.primary', varName: '--c-brand-primary' },
            { name: 'brand.primary-hover', varName: '--c-brand-primary-hover' },
            { name: 'brand.primary-pressed', varName: '--c-brand-primary-pressed' },
            { name: 'brand.primary-surface', varName: '--c-brand-primary-surface' },
        ]
    },
    {
        name: 'Confidence', tokens: [
            { name: 'confidence', varName: '--c-confidence' },
            { name: 'confidence.surface', varName: '--c-confidence-surface' },
        ]
    },
    {
        name: 'Urgency', tokens: [
            { name: 'urgency', varName: '--c-urgency' },
            { name: 'urgency.surface', varName: '--c-urgency-surface' },
        ]
    },
    {
        name: 'Live data', tokens: [
            { name: 'live-data', varName: '--c-live-data' },
            { name: 'live-data.surface', varName: '--c-live-data-surface' },
        ]
    },
    {
        name: 'Warning', tokens: [
            { name: 'warning', varName: '--c-warning' },
            { name: 'warning.surface', varName: '--c-warning-surface' },
        ]
    },
    {
        name: 'Grounds', tokens: [
            { name: 'ground', varName: '--c-ground' },
            { name: 'ground.elevated', varName: '--c-ground-elevated' },
            { name: 'ground.raised', varName: '--c-ground-raised' },
            { name: 'ground.sunken', varName: '--c-ground-sunken' },
        ]
    },
    {
        name: 'Text', tokens: [
            { name: 'text.primary', varName: '--c-text-primary' },
            { name: 'text.secondary', varName: '--c-text-secondary' },
            { name: 'text.tertiary', varName: '--c-text-tertiary' },
            { name: 'text.inverse', varName: '--c-text-inverse' },
            { name: 'text.on-urgency', varName: '--c-text-on-urgency' },
        ]
    },
    {
        name: 'Borders & glass', tokens: [
            { name: 'border.hairline', varName: '--c-border-hairline' },
            { name: 'border.subtle', varName: '--c-border-subtle' },
            { name: 'border.strong', varName: '--c-border-strong' },
            { name: 'glass.tint', varName: '--c-glass-tint' },
            { name: 'glass.border', varName: '--c-glass-border' },
        ]
    },
];

const TYPE_TOKENS = [
    { className: 'c-type-hero-xl', name: 'hero-xl', sample: 'Leave NOW' },
    { className: 'c-type-hero', name: 'hero', sample: '4:40:53' },
    { className: 'c-type-display', name: 'display', sample: '2:43 PM' },
    { className: 'c-type-title-xl', name: 'title-xl', sample: 'Page title' },
    { className: 'c-type-title', name: 'title', sample: 'Section header' },
    { className: 'c-type-headline', name: 'headline', sample: 'Card title / list row primary' },
    { className: 'c-type-body', name: 'body', sample: 'Body text. List row secondary text.' },
    { className: 'c-type-footnote', name: 'footnote', sample: 'Timestamp · helper text · labels.' },
    { className: 'c-type-caption', name: 'caption', sample: 'Account · Label · Badge' },
    { className: 'c-type-tabular', name: 'tabular', sample: '9 min · 42 min · 12 min' },
];

const SPACING = [
    { name: 'space-1', value: 4 },
    { name: 'space-2', value: 8 },
    { name: 'space-3', value: 12 },
    { name: 'space-4', value: 16 },
    { name: 'space-5', value: 20 },
    { name: 'space-6', value: 24 },
    { name: 'space-8', value: 32 },
    { name: 'space-10', value: 40 },
    { name: 'space-12', value: 48 },
    { name: 'space-16', value: 64 },
];

const RADII = [
    { name: 'radius-pill', value: 999 },
    { name: 'radius-lg', value: 20 },
    { name: 'radius-md', value: 14 },
    { name: 'radius-sm', value: 10 },
    { name: 'radius-xs', value: 6 },
];

const ICON_SAMPLES = [
    { Icon: MagnifyingGlass, label: 'Search' },
    { Icon: House, label: 'House' },
    { Icon: Airplane, label: 'Airplane' },
    { Icon: Gear, label: 'Gear' },
    { Icon: User, label: 'User' },
    { Icon: Bell, label: 'Bell' },
    { Icon: ShieldCheck, label: 'ShieldCheck' },
    { Icon: Car, label: 'Car' },
    { Icon: MapTrifold, label: 'MapTrifold' },
    { Icon: Clock, label: 'Clock' },
    { Icon: CreditCard, label: 'CreditCard' },
    { Icon: SignOut, label: 'SignOut' },
];

/* ── Section wrapper ─────────────────────────────────────────────────────── */
function Section({ title, description, children }) {
    return (
        <section className="mb-c-12">
            <h2 className="c-type-title-xl text-c-text-primary mb-c-2">{title}</h2>
            {description && (
                <p className="c-type-body text-c-text-secondary mb-c-6 max-w-[60ch]">{description}</p>
            )}
            {children}
        </section>
    );
}

function Swatch({ name, varName }) {
    return (
        <div className="flex items-center gap-c-3">
            <div
                className="w-12 h-12 rounded-c-sm border border-c-border-hairline shrink-0"
                style={{ background: `var(${varName})` }}
            />
            <div className="min-w-0">
                <div className="c-type-footnote text-c-text-primary truncate font-medium">{name}</div>
                <div className="c-type-caption text-c-text-tertiary truncate normal-case tracking-normal">{varName}</div>
            </div>
        </div>
    );
}

function PaletteBlock({ label }) {
    return (
        <div className="mb-c-8">
            <h3 className="c-type-headline text-c-text-primary mb-c-4">{label}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-c-6">
                {COLOR_GROUPS.map(group => (
                    <div key={group.name}>
                        <div className="c-type-caption text-c-text-tertiary mb-c-3">{group.name}</div>
                        <div className="space-y-c-3">
                            {group.tokens.map(t => <Swatch key={t.varName} {...t} />)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function DesignSystem() {
    const [segValue, setSegValue] = useState('active');
    const [tabValue, setTabValue] = useState('search');
    const [sheetOpen, setSheetOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');

    return (
        <div className="min-h-screen bg-c-ground text-c-text-primary font-c-sans pb-32">
            <div className="max-w-5xl mx-auto px-c-6 py-c-10">
                <header className="mb-c-12">
                    <div className="c-type-caption text-c-text-tertiary mb-c-2">Concourse · design system preview</div>
                    <h1 className="c-type-title-xl text-c-text-primary">AirBridge Design System</h1>
                    <p className="c-type-body text-c-text-secondary mt-c-2 max-w-[60ch]">
                        Internal preview of tokens and shared UI primitives per
                        AIRBRIDGE_DESIGN_BRIEF.md §3. Not linked from the app — direct URL only.
                    </p>
                </header>

                {/* ── COLORS — light and dark side by side ─────────────────── */}
                <Section title="1. Color palette" description="All Concourse tokens resolved as CSS custom properties. Left: light (default :root). Right: dark ([data-theme='dark']).">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-c-8">
                        <div className="p-c-5 rounded-c-lg border border-c-border-hairline bg-c-ground-elevated">
                            <PaletteBlock label="Light mode" />
                        </div>
                        <div data-theme="dark" className="p-c-5 rounded-c-lg border border-c-border-hairline bg-c-ground text-c-text-primary">
                            <PaletteBlock label="Dark mode" />
                        </div>
                    </div>
                </Section>

                {/* ── TYPOGRAPHY ────────────────────────────────────────────── */}
                <Section title="2. Type scale" description="General Sans, self-hosted. Brief's weight-800 hero-xl falls back to 700 Bold (font max).">
                    <div className="space-y-c-5">
                        {TYPE_TOKENS.map(t => (
                            <div key={t.name} className="pb-c-5 border-b border-c-border-hairline last:border-0">
                                <div className="c-type-caption text-c-text-tertiary mb-c-2">{t.name}</div>
                                <div className={t.className + ' text-c-text-primary break-words'}>{t.sample}</div>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* ── SPACING ──────────────────────────────────────────────── */}
                <Section title="3. Spacing scale" description="Base unit 4px. Page horizontal padding is always 24px.">
                    <div className="space-y-c-3">
                        {SPACING.map(s => (
                            <div key={s.name} className="flex items-center gap-c-4">
                                <div className="w-32 shrink-0">
                                    <div className="c-type-footnote text-c-text-primary">{s.name}</div>
                                    <div className="c-type-caption text-c-text-tertiary normal-case tracking-normal">{s.value}px</div>
                                </div>
                                <div className="h-6 bg-c-brand-primary rounded-c-xs" style={{ width: s.value }} />
                            </div>
                        ))}
                    </div>
                </Section>

                {/* ── RADIUS ───────────────────────────────────────────────── */}
                <Section title="4. Radius scale">
                    <div className="flex flex-wrap gap-c-6">
                        {RADII.map(r => (
                            <div key={r.name} className="flex flex-col items-center gap-c-2">
                                <div
                                    className="w-20 h-20 bg-c-brand-primary-surface border border-c-border-subtle"
                                    style={{ borderRadius: r.value > 100 ? 9999 : r.value }}
                                />
                                <div className="text-center">
                                    <div className="c-type-footnote text-c-text-primary">{r.name}</div>
                                    <div className="c-type-caption text-c-text-tertiary normal-case tracking-normal">{r.value === 999 ? 'pill' : `${r.value}px`}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* ── GLASS ─────────────────────────────────────────────────── */}
                <Section title="5. Glass surfaces" description="Nav layer only. Content cards are NEVER glass. Translucent over varied content.">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-c-6">
                        <GlassDemo theme="light" />
                        <GlassDemo theme="dark" />
                    </div>
                </Section>

                {/* ── ICONS ─────────────────────────────────────────────────── */}
                <Section title="6. Iconography" description="Phosphor Icons at Regular + Bold weights. 24px default.">
                    <div>
                        <div className="c-type-caption text-c-text-tertiary mb-c-3">Regular weight</div>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-c-4 mb-c-8">
                            {ICON_SAMPLES.map(({ Icon, label }) => (
                                <div key={`r-${label}`} className="flex flex-col items-center gap-c-2 p-c-3 rounded-c-md border border-c-border-hairline bg-c-ground-elevated">
                                    <Icon size={28} weight="regular" className="text-c-text-primary" />
                                    <div className="c-type-caption text-c-text-tertiary normal-case tracking-normal">{label}</div>
                                </div>
                            ))}
                        </div>
                        <div className="c-type-caption text-c-text-tertiary mb-c-3">Bold weight</div>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-c-4">
                            {ICON_SAMPLES.map(({ Icon, label }) => (
                                <div key={`b-${label}`} className="flex flex-col items-center gap-c-2 p-c-3 rounded-c-md border border-c-border-hairline bg-c-ground-elevated">
                                    <Icon size={28} weight="bold" className="text-c-brand-primary" />
                                    <div className="c-type-caption text-c-text-tertiary normal-case tracking-normal">{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Section>

                {/* ── COMPONENTS ──────────────────────────────────────────── */}
                <Section title="7. Components">

                    {/* Buttons */}
                    <div className="mb-c-10">
                        <h3 className="c-type-headline mb-c-4">Button</h3>
                        <div className="flex flex-wrap gap-c-3 mb-c-4">
                            <Button variant="primary">Primary</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="destructive">Destructive</Button>
                            <Button variant="primary" disabled>Disabled</Button>
                            <Button variant="primary" size="sm">Small</Button>
                        </div>
                        <Button variant="primary" full>Full-width primary</Button>
                    </div>

                    {/* StatusPill */}
                    <div className="mb-c-10">
                        <h3 className="c-type-headline mb-c-4">StatusPill</h3>
                        <div className="flex flex-wrap gap-c-3">
                            <StatusPill tone="confidence" dot>On time</StatusPill>
                            <StatusPill tone="urgency" dot>Leave now</StatusPill>
                            <StatusPill tone="warning" dot>Traffic +8 min</StatusPill>
                            <StatusPill tone="live-data" dot pulse>Live</StatusPill>
                            <StatusPill tone="neutral">Draft</StatusPill>
                        </div>
                    </div>

                    {/* SegmentedControl */}
                    <div className="mb-c-10">
                        <h3 className="c-type-headline mb-c-4">SegmentedControl</h3>
                        <SegmentedControl
                            segments={[
                                { value: 'active', label: 'Active' },
                                { value: 'history', label: 'History' },
                            ]}
                            value={segValue}
                            onChange={setSegValue}
                        />
                    </div>

                    {/* Input */}
                    <div className="mb-c-10 max-w-md">
                        <h3 className="c-type-headline mb-c-4">Input</h3>
                        <div className="space-y-c-4">
                            <Input
                                label="Flight number"
                                placeholder="UA 300"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                hint="Airline code + number"
                            />
                            <Input label="Error state" placeholder="Invalid" error="Flight not found" />
                            <Input label="Disabled" placeholder="—" disabled />
                        </div>
                    </div>

                    {/* Card */}
                    <div className="mb-c-10">
                        <h3 className="c-type-headline mb-c-4">Card</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-c-4">
                            <Card>
                                <div className="c-type-headline mb-c-1">Elevated (default)</div>
                                <div className="c-type-footnote text-c-text-secondary">Small shadow, hairline border, radius-lg.</div>
                            </Card>
                            <Card elevated={false}>
                                <div className="c-type-headline mb-c-1">Flat</div>
                                <div className="c-type-footnote text-c-text-secondary">No shadow — same border + radius.</div>
                            </Card>
                            <Card padding="lg">
                                <div className="c-type-headline mb-c-1">Large padding</div>
                                <div className="c-type-footnote text-c-text-secondary">padding=&quot;lg&quot; = 20px.</div>
                            </Card>
                        </div>
                    </div>

                    {/* ListRow */}
                    <div className="mb-c-10">
                        <h3 className="c-type-headline mb-c-4">ListRow</h3>
                        <div className="overflow-hidden rounded-c-lg border border-c-border-hairline divide-y divide-c-border-hairline max-w-xl">
                            <ListRow
                                leftIcon={<Bell size={20} />}
                                primary="Notifications"
                                secondary="Push · SMS · email"
                                chevron
                                onClick={() => {}}
                            />
                            <ListRow
                                leftIcon={<CreditCard size={20} />}
                                primary="Manage subscription"
                                right={<StatusPill tone="confidence">Pro</StatusPill>}
                                onClick={() => {}}
                            />
                            <ListRow
                                leftIcon={<ShieldCheck size={20} />}
                                primary="TSA PreCheck"
                                secondary="Saves ~15 min"
                            />
                            <ListRow
                                leftIcon={<SignOut size={20} />}
                                primary="Sign out"
                                onClick={() => {}}
                                className="text-c-urgency"
                            />
                        </div>
                    </div>

                    {/* TopBar */}
                    <div className="mb-c-10">
                        <h3 className="c-type-headline mb-c-4">TopBar</h3>
                        <div className="rounded-c-lg overflow-hidden border border-c-border-hairline max-w-xl">
                            <TopBar title="Settings" />
                        </div>
                        <div className="mt-c-3 rounded-c-lg overflow-hidden border border-c-border-hairline max-w-xl">
                            <TopBar
                                title="UA 300"
                                onBack={() => {}}
                                rightSlot={<Button size="sm" variant="secondary">Edit</Button>}
                            />
                        </div>
                    </div>

                    {/* Sheet */}
                    <div className="mb-c-10">
                        <h3 className="c-type-headline mb-c-4">Sheet</h3>
                        <Button variant="secondary" onClick={() => setSheetOpen(true)}>Open sheet</Button>
                        <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Transport mode">
                            <div className="space-y-c-3 py-c-2">
                                <p className="c-type-body text-c-text-secondary">Sheet content renders here. Tap scrim or press Escape to close.</p>
                                <Button variant="primary" full onClick={() => setSheetOpen(false)}>Done</Button>
                            </div>
                        </Sheet>
                    </div>

                    {/* TabBar — shown twice:
                         (a) real <TabBar /> floats at viewport bottom (production behavior)
                         (b) styled copy inside a contained gradient for visual inspection */}
                    <div className="mb-c-10">
                        <h3 className="c-type-headline mb-c-4">TabBar (floating Liquid Glass)</h3>
                        <p className="c-type-footnote text-c-text-secondary mb-c-3">
                            The real TabBar floats at the bottom of this viewport. The gradient
                            panel below shows the identical styling over varied content so glass
                            translucency is visible.
                        </p>
                        <div className="relative h-52 rounded-c-lg overflow-hidden border border-c-border-hairline"
                             style={{ background: 'linear-gradient(135deg, #EEEBFA 0%, #FFF4E0 50%, #E5FAF4 100%)' }}>
                            <div className="p-c-4 c-type-body text-c-text-primary">Background content</div>
                            <div className="absolute left-0 right-0 bottom-0">
                                <DemoTabBar value={tabValue} onChange={setTabValue} />
                            </div>
                        </div>
                    </div>
                </Section>

                {/* Real TabBar floats at viewport bottom */}
                <TabBar
                    value={tabValue}
                    onChange={setTabValue}
                    tabs={[
                        { value: 'search', label: 'Search', icon: <MagnifyingGlass size={22} weight="regular" />, iconActive: <MagnifyingGlass size={22} weight="bold" /> },
                        { value: 'trip', label: 'My Trip', icon: <Airplane size={22} weight="regular" />, iconActive: <Airplane size={22} weight="bold" />, badge: true },
                        { value: 'settings', label: 'Settings', icon: <Gear size={22} weight="regular" />, iconActive: <Gear size={22} weight="bold" /> },
                    ]}
                />

                {/* ── FOOTER NOTE ───────────────────────────────────────────── */}
                <p className="c-type-caption text-c-text-tertiary normal-case tracking-normal mt-c-10">
                    Built from AIRBRIDGE_DESIGN_BRIEF.md §3 (v2.0, April 18 2026).
                    Direct-URL only — not linked from the app.
                </p>
            </div>
        </div>
    );
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function GlassDemo({ theme }) {
    return (
        <div
            data-theme={theme === 'dark' ? 'dark' : undefined}
            className="relative h-64 rounded-c-lg overflow-hidden border border-c-border-hairline"
            style={{
                background: theme === 'dark'
                    ? 'linear-gradient(135deg, #1F1A4A 0%, #0B1220 50%, #0F3A30 100%)'
                    : 'linear-gradient(135deg, #EEEBFA 0%, #FFF4E0 50%, #E5FAF4 100%)'
            }}
        >
            <div className="absolute inset-0 flex flex-col justify-end">
                <div className="p-c-4">
                    <div className="c-glass rounded-c-pill h-14 border border-[color:var(--c-glass-border)] flex items-center justify-around px-c-4 shadow-c-glass">
                        <div className="c-type-caption text-c-text-secondary">Search</div>
                        <div className="c-type-caption text-c-text-secondary">My Trip</div>
                        <div className="c-type-caption text-c-text-secondary">Settings</div>
                    </div>
                    <div className="c-type-caption text-c-text-tertiary normal-case tracking-normal mt-c-2">
                        {theme === 'dark' ? 'Dark glass over concourse navy' : 'Light glass over warm paper'}
                    </div>
                </div>
            </div>
        </div>
    );
}

function DemoTabBar({ value, onChange }) {
    const tabs = [
        {
            value: 'search',
            label: 'Search',
            icon: <MagnifyingGlass size={22} weight="regular" />,
            iconActive: <MagnifyingGlass size={22} weight="bold" />,
        },
        {
            value: 'trip',
            label: 'My Trip',
            icon: <Airplane size={22} weight="regular" />,
            iconActive: <Airplane size={22} weight="bold" />,
            badge: true,
        },
        {
            value: 'settings',
            label: 'Settings',
            icon: <Gear size={22} weight="regular" />,
            iconActive: <Gear size={22} weight="bold" />,
        },
    ];
    // Render TabBar-styled markup inline so it's positioned inside the demo container,
    // not fixed to the viewport.
    return (
        <nav className="pb-c-3 px-c-4">
            <div className="c-glass border border-[color:var(--c-glass-border)] rounded-c-pill shadow-c-glass flex items-center">
                {tabs.map(tab => {
                    const active = tab.value === value;
                    return (
                        <button
                            key={tab.value}
                            type="button"
                            onClick={() => onChange(tab.value)}
                            className={
                                'relative flex-1 h-14 flex flex-col items-center justify-center gap-0.5 rounded-c-pill transition-colors duration-c-fast ' +
                                (active ? 'text-c-brand-primary' : 'text-c-text-secondary')
                            }
                        >
                            <span className="relative inline-flex">
                                {active && tab.iconActive ? tab.iconActive : tab.icon}
                                {tab.badge && (
                                    <span className="absolute -top-0.5 -right-1 rounded-full bg-c-urgency" style={{ width: 6, height: 6 }} />
                                )}
                            </span>
                            <span className="c-type-caption">{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
