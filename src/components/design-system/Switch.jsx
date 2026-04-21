import { cn } from '@/lib/utils';

/**
 * Switch — Concourse toggle (brief §3 tokens).
 *
 * Controlled. Track fills with brand-primary when on, ground-sunken when off.
 * 48×28 pill with a 24px thumb — comfortably above the 44pt iOS tap target.
 *
 * Props:
 *   checked:   boolean
 *   onChange:  (next: boolean) => void
 *   disabled:  boolean
 *   ariaLabel: optional (use when there's no visible label next to the switch)
 *   className
 */
export default function Switch({
    checked = false,
    onChange,
    disabled = false,
    ariaLabel,
    className,
    ...rest
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={() => !disabled && onChange?.(!checked)}
            className={cn(
                'relative inline-flex items-center h-7 w-12 rounded-c-pill transition-colors duration-c-fast ease-c-standard shrink-0',
                checked ? 'bg-c-brand-primary' : 'bg-c-ground-sunken',
                disabled && 'opacity-50 pointer-events-none',
                className
            )}
            {...rest}
        >
            <span
                aria-hidden="true"
                className={cn(
                    'inline-block h-6 w-6 rounded-full bg-c-ground-elevated shadow-c-sm transition-transform duration-c-fast ease-c-standard',
                    checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
                )}
            />
        </button>
    );
}
