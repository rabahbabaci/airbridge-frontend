import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Input — text input on sunken ground (brief §3.1 grounds, §3.4 radius-md).
 *
 * Props:
 *   label:      optional label rendered above the input
 *   hint:       optional helper text below
 *   error:      optional error text below (takes priority over hint)
 *   leftIcon / rightSlot: ReactNode
 *   disabled
 *   ...standard input props (type, value, onChange, placeholder, etc.)
 */
const Input = forwardRef(function Input(
    { label, hint, error, leftIcon, rightSlot, disabled, className, id, ...rest },
    ref
) {
    const inputId = id || (label ? `c-input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
    return (
        <label htmlFor={inputId} className="block">
            {label && (
                <span className="c-type-caption text-c-text-secondary block mb-c-2">{label}</span>
            )}
            <span
                className={cn(
                    'flex items-center gap-c-2 bg-c-ground-sunken rounded-c-md border border-c-border-hairline px-c-3 h-12',
                    'focus-within:border-c-border-strong transition-colors duration-c-fast',
                    error && 'border-c-urgency',
                    disabled && 'opacity-50 pointer-events-none',
                    className
                )}
            >
                {leftIcon && <span className="shrink-0 text-c-text-tertiary">{leftIcon}</span>}
                <input
                    ref={ref}
                    id={inputId}
                    disabled={disabled}
                    className="flex-1 bg-transparent outline-none c-type-body text-c-text-primary placeholder:text-c-text-tertiary"
                    {...rest}
                />
                {rightSlot && <span className="shrink-0">{rightSlot}</span>}
            </span>
            {(error || hint) && (
                <span
                    className={cn(
                        'c-type-footnote mt-c-1 block',
                        error ? 'text-c-urgency' : 'text-c-text-tertiary'
                    )}
                >
                    {error || hint}
                </span>
            )}
        </label>
    );
});

export default Input;
