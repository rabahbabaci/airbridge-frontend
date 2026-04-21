import { cn } from '@/lib/utils';

/**
 * StatusPill — compact status indicator (brief §3.1 semantic colors).
 *
 * Props:
 *   tone:  'confidence' | 'urgency' | 'warning' | 'live-data' | 'neutral' (default 'neutral')
 *   dot:   boolean — shows a colored dot prefix (default false)
 *   pulse: boolean — animated pulse on dot (for 'live-data' typically)
 *   children: label (caption type, auto-uppercased)
 *   className
 */
export default function StatusPill({
    tone = 'neutral',
    dot = false,
    pulse = false,
    className,
    children,
    ...rest
}) {
    const tones = {
        confidence: 'bg-c-confidence-surface text-c-confidence',
        urgency: 'bg-c-urgency-surface text-c-urgency',
        warning: 'bg-c-warning-surface text-c-warning',
        'live-data': 'bg-c-live-data-surface text-c-warning',
        neutral: 'bg-c-ground-sunken text-c-text-secondary',
    };
    const dotColors = {
        confidence: 'bg-c-confidence',
        urgency: 'bg-c-urgency',
        warning: 'bg-c-warning',
        'live-data': 'bg-c-live-data',
        neutral: 'bg-c-text-tertiary',
    };
    return (
        <span
            className={cn(
                'c-type-caption inline-flex items-center gap-c-2 px-c-3 py-c-1 rounded-c-pill',
                tones[tone],
                className
            )}
            {...rest}
        >
            {dot && (
                <span className="relative inline-flex">
                    <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[tone])} />
                    {pulse && (
                        <span className={cn('absolute inset-0 rounded-full animate-ping opacity-75', dotColors[tone])} />
                    )}
                </span>
            )}
            {children}
        </span>
    );
}
