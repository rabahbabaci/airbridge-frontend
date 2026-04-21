import { cn } from '@/lib/utils';
import { useEffect } from 'react';

/**
 * Sheet — bottom sheet with drag handle (brief §2.4 "drag-handle at top")
 * or centered modal variant for confirmations.
 *
 * Controlled component. Parent manages open state. Closes on scrim tap
 * and on Escape.
 *
 * Props:
 *   open:      boolean
 *   onClose:   () => void
 *   title:     optional header string
 *   placement: 'bottom' | 'center' (default 'bottom'). Centered variant
 *              is for short confirmation modals — no drag handle, all
 *              corners rounded, constrained max-width.
 *   maxHeight: CSS length (default '90vh'; unused in 'center' placement)
 *   children
 */
export default function Sheet({ open, onClose, title, placement = 'bottom', maxHeight = '90vh', children }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    const centered = placement === 'center';

    return (
        <div className={cn('fixed inset-0 z-50 flex justify-center', centered ? 'items-center p-c-4' : 'items-end')}>
            {/* Scrim */}
            <div
                aria-hidden="true"
                onClick={onClose}
                className="absolute inset-0 bg-black/30 transition-opacity duration-c-normal"
            />
            {/* Surface */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title || 'Dialog'}
                className={cn(
                    'relative bg-c-ground-elevated shadow-c-lg flex flex-col',
                    'transition-transform duration-c-normal ease-c-decelerate',
                    centered
                        ? 'w-full max-w-[380px] rounded-c-lg'
                        : 'w-full max-w-xl rounded-t-c-lg'
                )}
                style={centered ? undefined : { maxHeight }}
            >
                {!centered && (
                    <div className="flex justify-center pt-c-3 pb-c-1">
                        <span className="w-10 h-1 rounded-c-pill bg-c-border-subtle" />
                    </div>
                )}
                {title && (
                    <div className={cn('px-c-6', centered ? 'pt-c-6 pb-c-3' : 'pb-c-3')}>
                        <h2 className="c-type-title text-c-text-primary">{title}</h2>
                    </div>
                )}
                <div className={cn('overflow-y-auto px-c-6', centered ? 'pb-c-6' : 'pb-c-6')}>
                    {children}
                </div>
            </div>
        </div>
    );
}
