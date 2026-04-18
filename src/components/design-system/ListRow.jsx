import { cn } from '@/lib/utils';
import { CaretRight } from '@phosphor-icons/react';

/**
 * ListRow — single row inside a list surface (brief §4 usage patterns).
 *
 * Props:
 *   leftIcon:   ReactNode (optional, monochrome Phosphor recommended)
 *   primary:    string | ReactNode (headline-weight text)
 *   secondary:  string | ReactNode (optional footnote supporting text)
 *   right:      ReactNode (optional — overrides chevron)
 *   chevron:    boolean (default false; shows caret-right when no `right`)
 *   onClick:    if provided, row is interactive (button semantics)
 *   disabled:   boolean
 *   className
 */
export default function ListRow({
    leftIcon,
    primary,
    secondary,
    right,
    chevron = false,
    onClick,
    disabled = false,
    className,
    ...rest
}) {
    const interactive = !!onClick;
    const Tag = interactive ? 'button' : 'div';
    return (
        <Tag
            type={interactive ? 'button' : undefined}
            onClick={onClick}
            disabled={disabled || undefined}
            className={cn(
                'flex items-center gap-c-3 w-full text-left min-h-[44px] px-c-4 py-c-3',
                'bg-c-ground-elevated',
                interactive && 'transition-colors duration-c-fast hover:bg-c-ground-sunken active:bg-c-ground-sunken',
                disabled && 'opacity-50 pointer-events-none',
                className
            )}
            {...rest}
        >
            {leftIcon && (
                <div className="shrink-0 w-9 h-9 flex items-center justify-center text-c-text-secondary">
                    {leftIcon}
                </div>
            )}
            <div className="flex-1 min-w-0">
                <div className="c-type-headline text-c-text-primary truncate">{primary}</div>
                {secondary && (
                    <div className="c-type-footnote text-c-text-secondary truncate mt-0.5">{secondary}</div>
                )}
            </div>
            {right !== undefined ? (
                <div className="shrink-0 flex items-center text-c-text-secondary">{right}</div>
            ) : chevron ? (
                <CaretRight size={16} className="shrink-0 text-c-text-tertiary" />
            ) : null}
        </Tag>
    );
}
