import { cn } from '@/lib/utils';
import { useEffect } from 'react';

/**
 * Sheet — bottom sheet with drag handle (brief §2.4 "drag-handle at top").
 *
 * Controlled component. Parent manages open state. Closes on scrim tap
 * and on Escape.
 *
 * Props:
 *   open:      boolean
 *   onClose:   () => void
 *   title:     optional header string
 *   maxHeight: CSS length (default '90vh')
 *   children
 */
export default function Sheet({ open, onClose, title, maxHeight = '90vh', children }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Scrim */}
            <div
                aria-hidden="true"
                onClick={onClose}
                className="absolute inset-0 bg-black/30 transition-opacity duration-c-normal"
            />
            {/* Sheet */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title || 'Sheet'}
                className={cn(
                    'relative w-full max-w-xl bg-c-ground-elevated',
                    'rounded-t-c-lg shadow-c-lg',
                    'transition-transform duration-c-normal ease-c-decelerate',
                    'flex flex-col'
                )}
                style={{ maxHeight }}
            >
                <div className="flex justify-center pt-c-3 pb-c-1">
                    <span className="w-10 h-1 rounded-c-pill bg-c-border-subtle" />
                </div>
                {title && (
                    <div className="px-c-6 pb-c-3">
                        <h2 className="c-type-title text-c-text-primary">{title}</h2>
                    </div>
                )}
                <div className="overflow-y-auto px-c-6 pb-c-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
