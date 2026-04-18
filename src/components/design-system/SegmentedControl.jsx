import { cn } from '@/lib/utils';

/**
 * SegmentedControl — pill-shaped segmented toggle (brief §3.4 pill radius).
 *
 * Props:
 *   segments: Array<{ value: string, label: string | ReactNode }>
 *   value:    currently selected segment value
 *   onChange: (value) => void
 *   size:     'md' | 'sm' (default 'md')
 *   className
 */
export default function SegmentedControl({
    segments,
    value,
    onChange,
    size = 'md',
    className,
    ...rest
}) {
    const heightCls = size === 'sm' ? 'h-9' : 'h-11';
    return (
        <div
            role="tablist"
            className={cn(
                'inline-flex items-center p-c-1 bg-c-ground-sunken rounded-c-pill',
                heightCls,
                className
            )}
            {...rest}
        >
            {segments.map((seg) => {
                const active = seg.value === value;
                return (
                    <button
                        key={seg.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange?.(seg.value)}
                        className={cn(
                            'c-type-footnote h-full px-c-4 rounded-c-pill transition-colors duration-c-fast ease-c-standard',
                            active
                                ? 'bg-c-ground-elevated text-c-text-primary shadow-c-sm font-semibold'
                                : 'text-c-text-secondary hover:text-c-text-primary'
                        )}
                    >
                        {seg.label}
                    </button>
                );
            })}
        </div>
    );
}
