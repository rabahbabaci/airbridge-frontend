import { cn } from '@/lib/utils';

/**
 * TabBar — floating Liquid Glass bottom nav (brief §2.1, §3.8).
 *
 * Shows exactly three tabs (Search / My Trip / Settings in production).
 * This is a pure UI primitive — parent owns active-tab state and onChange.
 *
 * Props:
 *   tabs: Array<{
 *     value: string,
 *     label: string,
 *     icon: ReactNode,       (inactive weight — Phosphor Regular recommended)
 *     iconActive?: ReactNode, (active weight — Phosphor Bold recommended)
 *     badge?: boolean        (red-dot per brief §2.3)
 *   }>
 *   value:    active tab value
 *   onChange: (value) => void
 *   className
 */
export default function TabBar({ tabs, value, onChange, className }) {
    return (
        <nav
            className={cn(
                'fixed left-0 right-0 bottom-0 pb-[env(safe-area-inset-bottom)] z-40',
                className
            )}
            aria-label="Primary"
        >
            <div className="mx-c-4 mb-c-3 c-glass border border-[color:var(--c-glass-border)] rounded-c-pill shadow-c-glass flex items-center">
                {tabs.map((tab) => {
                    const active = tab.value === value;
                    return (
                        <button
                            key={tab.value}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => onChange?.(tab.value)}
                            className={cn(
                                'relative flex-1 h-14 flex flex-col items-center justify-center gap-0.5 rounded-c-pill transition-colors duration-c-fast',
                                active ? 'text-c-brand-primary' : 'text-c-text-secondary hover:text-c-text-primary'
                            )}
                        >
                            <span className="relative inline-flex">
                                {active && tab.iconActive ? tab.iconActive : tab.icon}
                                {tab.badge && (
                                    <span
                                        aria-label="Unread"
                                        className="absolute -top-0.5 -right-1 w-1.5 h-1.5 rounded-full bg-c-urgency"
                                        style={{ width: 6, height: 6 }}
                                    />
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
