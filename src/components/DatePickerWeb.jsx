import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import { addMonths, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Custom-styled date picker for WEB ONLY ──────────────────────────────
   Capacitor/iOS keeps using the native wheel picker via showPicker() — this
   component is gated behind !isNative() in the call site (Search.jsx).

   Positioning: portaled to document.body so we escape Card/main overflow
   constraints. On wide viewports (≥ 400px) we anchor below and horizontally
   center on the triggering button. On narrow viewports we fall back to a
   centered modal with a dimmed backdrop — avoids the popover getting clipped
   by the viewport edge on small screens.

   Styling: all colors come from Concourse tokens (src/styles/design-system.css,
   §3.1). `classNames` overrides every react-day-picker v8 slot so we don't
   need to import the library's default CSS. */

const NARROW_VIEWPORT_PX = 400;
const POPOVER_ESTIMATED_WIDTH = 280; // used before panel is measured

function toIsoDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export default function DatePickerWeb({
    value,
    onChange,
    open,
    onOpenChange,
    anchorRef,
    minDate,
    maxDate,
}) {
    const panelRef = useRef(null);
    const [position, setPosition] = useState(null);

    const selectedDate = value ? parseISO(value) : undefined;
    const fromDate = minDate || new Date();
    const toDate = maxDate || addMonths(new Date(), 12);

    // Position: recomputed on open, viewport resize, and ancestor scroll.
    // useLayoutEffect so the first measured position paints before the user
    // sees an off-screen panel flash.
    useLayoutEffect(() => {
        if (!open) return;

        function computePosition() {
            const anchor = anchorRef?.current;
            if (!anchor) return;

            const vw = window.innerWidth;
            if (vw < NARROW_VIEWPORT_PX) {
                setPosition({ narrow: true });
                return;
            }

            const rect = anchor.getBoundingClientRect();
            const panelW = panelRef.current?.offsetWidth || POPOVER_ESTIMATED_WIDTH;
            let left = rect.left + rect.width / 2 - panelW / 2;
            // Clamp horizontally into viewport with an 8px margin so the
            // panel never touches or overflows the edge.
            left = Math.max(8, Math.min(left, vw - panelW - 8));
            const top = rect.bottom + 8;
            setPosition({ narrow: false, top, left });
        }

        computePosition();
        // Second pass once the panel is in the DOM and its real width is
        // measurable — corrects the initial estimate.
        const raf = requestAnimationFrame(computePosition);
        window.addEventListener('resize', computePosition);
        window.addEventListener('scroll', computePosition, true);
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', computePosition);
            window.removeEventListener('scroll', computePosition, true);
        };
    }, [open, anchorRef]);

    // Close on outside click / Escape.
    useEffect(() => {
        if (!open) return;

        function onMouseDown(e) {
            const panel = panelRef.current;
            const anchor = anchorRef?.current;
            if (panel && !panel.contains(e.target) && !(anchor && anchor.contains(e.target))) {
                onOpenChange(false);
            }
        }
        function onKey(e) {
            if (e.key === 'Escape') onOpenChange(false);
        }
        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open, anchorRef, onOpenChange]);

    if (!open || !position) return null;

    const isNarrow = position.narrow;

    const panel = (
        <div
            ref={panelRef}
            role="dialog"
            aria-label="Pick a date"
            className={cn(
                'fixed z-[99] bg-c-ground-elevated border border-c-border-hairline',
                'rounded-c-lg shadow-c-lg p-c-3 font-c-sans text-c-text-primary',
                isNarrow && 'left-c-4 right-c-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto'
            )}
            style={isNarrow ? undefined : { top: position.top, left: position.left }}
        >
            <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={(d) => {
                    if (!d) return;
                    onChange(toIsoDate(d));
                    onOpenChange(false);
                }}
                fromDate={fromDate}
                toDate={toDate}
                weekStartsOn={0}
                showOutsideDays
                components={{
                    IconLeft: (p) => <ChevronLeft size={20} strokeWidth={2} {...p} />,
                    IconRight: (p) => <ChevronRight size={20} strokeWidth={2} {...p} />,
                }}
                classNames={{
                    months: 'flex flex-col gap-c-3',
                    month: 'space-y-c-2',
                    caption: 'relative flex items-center justify-center h-8',
                    caption_label: 'c-type-headline text-c-text-primary',
                    nav: 'absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none',
                    nav_button:
                        'pointer-events-auto w-8 h-8 rounded-c-pill inline-flex items-center justify-center ' +
                        'text-c-brand-primary hover:bg-c-brand-primary-surface transition-colors duration-c-fast',
                    table: 'w-full border-collapse',
                    head_row: 'flex',
                    head_cell:
                        'w-9 h-7 flex items-center justify-center c-type-caption text-c-text-secondary',
                    row: 'flex w-full mt-c-1',
                    cell: 'w-9 h-9 p-0 text-center relative focus-within:z-10',
                    day:
                        'w-9 h-9 inline-flex items-center justify-center rounded-c-pill ' +
                        'c-type-footnote text-c-text-primary cursor-pointer ' +
                        'hover:bg-c-brand-primary-surface transition-colors duration-c-fast ' +
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-c-brand-primary',
                    // `!` forces override of the base `day` classes — Tailwind
                    // class ordering between concatenated slots is unreliable.
                    day_selected:
                        '!bg-c-brand-primary !text-white hover:!bg-c-brand-primary-hover',
                    day_today: 'ring-1 ring-inset ring-c-brand-primary',
                    day_outside: 'text-c-text-tertiary',
                    day_disabled: 'text-c-text-tertiary opacity-40 pointer-events-none hover:bg-transparent',
                    day_hidden: 'invisible',
                }}
            />
        </div>
    );

    return createPortal(
        <>
            {isNarrow && (
                <div
                    onClick={() => onOpenChange(false)}
                    className="fixed inset-0 z-[98] bg-c-text-primary/20"
                    aria-hidden="true"
                />
            )}
            {panel}
        </>,
        document.body,
    );
}
