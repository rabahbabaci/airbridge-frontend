import { cn } from '@/lib/utils';

/**
 * Button — Concourse primary/secondary/destructive CTA (brief §3).
 *
 * Props:
 *   variant: 'primary' | 'secondary' | 'destructive' (default 'primary')
 *   size:    'md' | 'sm' (default 'md'; md is 48px tall, exceeds 44pt tap target)
 *   disabled: boolean
 *   full:    boolean — stretches to 100% width
 *   leftIcon / rightIcon: ReactNode
 *   children, onClick, type, ...rest
 */
export default function Button({
    variant = 'primary',
    size = 'md',
    disabled = false,
    full = false,
    leftIcon,
    rightIcon,
    className,
    children,
    ...rest
}) {
    const base = 'c-type-headline inline-flex items-center justify-center gap-c-2 rounded-c-pill transition-[background-color,transform] duration-c-fast ease-c-standard select-none whitespace-nowrap active:scale-[0.98]';
    const sizes = {
        md: 'h-12 px-c-6 min-w-[44px]',
        sm: 'h-10 px-c-5 min-w-[44px]',
    };
    const variants = {
        primary: 'bg-c-brand-primary text-c-text-inverse hover:bg-c-brand-primary-hover active:bg-c-brand-primary-pressed',
        secondary: 'bg-c-ground-elevated text-c-text-primary border border-c-border-subtle hover:border-c-border-strong',
        destructive: 'bg-c-urgency text-c-text-on-urgency hover:brightness-95 active:brightness-90',
    };
    const disabledCls = 'opacity-50 pointer-events-none';
    return (
        <button
            type="button"
            disabled={disabled}
            aria-disabled={disabled || undefined}
            className={cn(base, sizes[size], variants[variant], full && 'w-full', disabled && disabledCls, className)}
            {...rest}
        >
            {leftIcon}
            {children}
            {rightIcon}
        </button>
    );
}
