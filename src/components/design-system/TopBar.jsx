import { cn } from '@/lib/utils';
import { CaretLeft } from '@phosphor-icons/react';

/**
 * TopBar — page header (brief §2.4).
 *
 * Props:
 *   title:      string | ReactNode
 *   onBack:     () => void — shows "<" chevron when provided
 *   leftSlot:   ReactNode — overrides the back chevron
 *   rightSlot:  ReactNode
 *   align:      'left' | 'center' (default 'center'; matches iOS nav)
 *   variant:    'default' | 'translucent' (translucent = glass over dark ground per §2.4)
 *   className
 */
export default function TopBar({
    title,
    onBack,
    leftSlot,
    rightSlot,
    align = 'center',
    variant = 'default',
    className,
}) {
    const translucent = variant === 'translucent';
    return (
        <header
            className={cn(
                'relative flex items-center h-14 px-c-4 pt-[calc(env(safe-area-inset-top)_+_12px)]',
                translucent ? 'c-glass' : 'bg-c-ground border-b border-c-border-hairline',
                className
            )}
        >
            <div className="flex-1 flex items-center gap-c-2 min-w-0">
                {leftSlot ? leftSlot : onBack ? (
                    <button
                        type="button"
                        onClick={onBack}
                        aria-label="Back"
                        className="w-11 h-11 flex items-center justify-center rounded-c-pill text-c-text-primary hover:bg-c-ground-sunken transition-colors duration-c-fast"
                    >
                        <CaretLeft size={22} weight="regular" />
                    </button>
                ) : null}
                {align === 'left' && title && (
                    <h1 className="c-type-title-xl text-c-text-primary truncate">{title}</h1>
                )}
            </div>
            {align === 'center' && title && (
                <h1 className="absolute left-1/2 -translate-x-1/2 c-type-headline text-c-text-primary truncate max-w-[60%] text-center">
                    {title}
                </h1>
            )}
            <div className="flex-1 flex items-center justify-end gap-c-2 min-w-0">
                {rightSlot}
            </div>
        </header>
    );
}
