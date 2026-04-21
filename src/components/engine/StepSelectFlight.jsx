import { useState } from 'react';
import { motion } from 'framer-motion';
import { shortCity, formatLocalTime, parseTimeToDate } from '@/utils/format';
import TopBar from '@/components/design-system/TopBar';
import StatusPill from '@/components/design-system/StatusPill';
import Button from '@/components/design-system/Button';
import Sheet from '@/components/design-system/Sheet';
import { cn } from '@/lib/utils';

const pageTransition = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
    exit: { opacity: 0, y: -16, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
};

// Compute display status for a flight. Cancelled takes precedence over all else.
function flightStatus(f) {
    if (f.canceled) return { label: 'Cancelled', tone: 'urgency' };
    if (f.departed) return { label: 'Departed', tone: 'neutral' };
    if (f.is_boarding) return { label: 'Boarding now', tone: 'warning' };
    if (f.is_delayed && f.revised_departure_local) {
        const scheduled = parseTimeToDate(f.departure_time);
        const revised = parseTimeToDate(f.revised_departure_local);
        if (scheduled && revised && revised > scheduled) {
            const diffMin = Math.round((revised - scheduled) / 60000);
            return { label: `+${diffMin} min delay`, tone: 'warning' };
        }
    }
    return { label: 'On time', tone: 'confidence' };
}

function flightRouteLabel(f) {
    const origin = shortCity(f.origin_name) || f.origin_code || '';
    const dest = shortCity(f.destination_name) || f.destination_code || '';
    const parts = [`${origin} → ${dest}`];
    if (f.terminal) parts.push(f.terminal);
    return parts.join(' · ');
}

function FlightCard({ flight, onSelect }) {
    const status = flightStatus(flight);
    const isDim = flight.canceled || flight.departed;
    return (
        <button
            type="button"
            onClick={() => onSelect(flight)}
            className={cn(
                'w-full text-left bg-c-ground-elevated border border-c-border-hairline rounded-c-lg shadow-c-sm',
                'p-c-5 transition-[transform,box-shadow,border-color] duration-c-fast ease-c-standard',
                'hover:border-c-border-strong hover:shadow-c-md active:scale-[0.995]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-c-brand-primary focus-visible:ring-offset-2',
                isDim && 'opacity-60'
            )}
        >
            <div className="flex items-start justify-between gap-c-3">
                <div className="min-w-0">
                    <div className="c-type-headline text-c-text-primary truncate">
                        {flight.airline_name ? `${flight.airline_name} ` : ''}
                        <span className="font-mono">{flight.flight_number}</span>
                    </div>
                    <div className="c-type-footnote text-c-text-secondary mt-c-1 truncate">
                        {flightRouteLabel(flight)}
                    </div>
                </div>
                <div className="shrink-0 text-right">
                    <div className="c-type-headline text-c-text-primary tabular-nums">
                        {formatLocalTime(flight.departure_time)}
                    </div>
                </div>
            </div>

            <div className="mt-c-3">
                <StatusPill tone={status.tone}>{status.label}</StatusPill>
            </div>
        </button>
    );
}

export default function StepSelectFlight({
    flightOptions, onSelect, onBack,
}) {
    const [helpOpen, setHelpOpen] = useState(false);

    const showEmpty = flightOptions.length === 0;
    const showList = flightOptions.length > 0;

    return (
        <motion.div key="s2" {...pageTransition} className="w-full min-h-screen bg-c-ground">
            <TopBar title="Select your flight" onBack={onBack} align="center" />

            <main className="px-c-6 pt-c-6 pb-40 max-w-xl mx-auto">
                <h1 className="c-type-title text-c-text-primary">Multiple flights match</h1>
                <p className="c-type-body text-c-text-secondary mt-c-1">Which one is yours?</p>

                <div className="mt-c-6 space-y-c-4">
                    {showEmpty && (
                        <div className="text-center py-c-8">
                            <h2 className="c-type-headline text-c-text-primary">No flights match</h2>
                            <p className="c-type-body text-c-text-secondary mt-c-2">
                                We couldn’t find a flight for your search.
                            </p>
                            <div className="mt-c-6 flex justify-center">
                                <Button variant="primary" onClick={onBack}>
                                    Retry search
                                </Button>
                            </div>
                        </div>
                    )}

                    {showList && flightOptions.map((f, i) => (
                        <FlightCard
                            key={`${f.flight_number}|${f.departure_time_utc || ''}|${f.origin_code || ''}|${i}`}
                            flight={f}
                            onSelect={onSelect}
                        />
                    ))}
                </div>

                {showList && (
                    <div className="mt-c-6 flex justify-center">
                        <button
                            type="button"
                            onClick={() => setHelpOpen(true)}
                            className="c-type-footnote text-c-brand-primary hover:text-c-brand-primary-hover underline"
                        >
                            I don’t see my flight
                        </button>
                    </div>
                )}
            </main>

            <Sheet open={helpOpen} onClose={() => setHelpOpen(false)} title="Don’t see your flight?">
                <div className="space-y-c-4">
                    <p className="c-type-body text-c-text-secondary">
                        Your flight may not appear in our search if:
                    </p>
                    <ul className="c-type-body text-c-text-secondary list-disc pl-c-5 space-y-c-2">
                        <li>It’s an international flight — AirBridge is US-domestic only in beta.</li>
                        <li>It departs from an airport outside SFO, OAK, or SJC.</li>
                        <li>It was added very recently and our data source hasn’t indexed it yet.</li>
                    </ul>
                    <p className="c-type-body text-c-text-secondary">
                        If none of those apply, try searching by flight number instead, or email
                        support at{' '}
                        <a
                            href="mailto:hello@airbridge.live"
                            className="text-c-brand-primary underline"
                        >
                            hello@airbridge.live
                        </a>
                        .
                    </p>
                    <div className="pt-c-2">
                        <Button variant="secondary" full onClick={() => setHelpOpen(false)}>
                            Close
                        </Button>
                    </div>
                </div>
            </Sheet>
        </motion.div>
    );
}
