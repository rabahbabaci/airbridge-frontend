import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Calendar, Search, AlertCircle, Loader2 } from 'lucide-react';
import AirportAutocomplete from './AirportAutocomplete';
import { mapFlights } from '@/utils/mapFlight';

import { API_BASE } from '@/config';

const TIME_WINDOWS = [
    { id: 'any', label: 'Any time' },
    { id: 'morning', label: 'Morning', sub: '5am–12pm' },
    { id: 'afternoon', label: 'Afternoon', sub: '12–6pm' },
    { id: 'evening', label: 'Evening', sub: '6–10pm' },
    { id: 'late_night', label: 'Red-eye', sub: '10pm–5am' },
];

const stagger = {
    hidden: { opacity: 0, y: 16 },
    visible: (i) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.07, duration: 0.35, ease: [0.4, 0, 0.2, 1] },
    }),
};

export default function RouteSearchForm({
    onFlightsFound, authHeaders,
    // Optional controlled props — if provided, use them instead of local state
    origin: controlledOrigin, setOrigin: controlledSetOrigin,
    destination: controlledDestination, setDestination: controlledSetDestination,
    date: controlledDate, setDate: controlledSetDate,
    timeWindow: controlledTimeWindow, setTimeWindow: controlledSetTimeWindow,
    lastSearchParams, existingResults,
}) {
    // Local state as fallback when not controlled
    const [localOrigin, localSetOrigin] = useState('');
    const [localDestination, localSetDestination] = useState('');
    const [localDate, localSetDate] = useState('');
    const [localTimeWindow, localSetTimeWindow] = useState('any');

    const origin = controlledOrigin !== undefined ? controlledOrigin : localOrigin;
    const setOrigin = controlledSetOrigin || localSetOrigin;
    const destination = controlledDestination !== undefined ? controlledDestination : localDestination;
    const setDestination = controlledSetDestination || localSetDestination;
    const date = controlledDate !== undefined ? controlledDate : localDate;
    const setDate = controlledSetDate || localSetDate;
    const timeWindow = controlledTimeWindow !== undefined ? controlledTimeWindow : localTimeWindow;
    const setTimeWindow = controlledSetTimeWindow || localSetTimeWindow;

    const [calendarOpen, setCalendarOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const canSearch = origin && destination && date;

    async function handleSearch() {
        if (!canSearch || loading) return;

        // Skip re-fetch if inputs haven't changed and we have results
        if (
            lastSearchParams &&
            lastSearchParams.mode === 'route' &&
            lastSearchParams.origin === origin &&
            lastSearchParams.destination === destination &&
            lastSearchParams.date === date &&
            lastSearchParams.timeWindow === timeWindow &&
            existingResults && existingResults.length > 0
        ) {
            onFlightsFound(existingResults, { origin, destination, date, timeWindow });
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ origin, destination, date });
            if (timeWindow !== 'any') params.set('time_window', timeWindow);

            const res = await fetch(`${API_BASE}/v1/flights/search?${params}`, {
                headers: { ...authHeaders },
            });
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.detail || 'Could not search flights. Please try again.');
            }
            const data = await res.json();
            const mapped = mapFlights(data.flights || []);
            onFlightsFound(mapped, { origin, destination, date, timeWindow });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-4">
            <motion.div custom={1} variants={stagger} initial="hidden" animate="visible">
                <AirportAutocomplete
                    value={origin}
                    onChange={setOrigin}
                    label="From"
                    placeholder="Origin airport..."
                />
            </motion.div>

            <motion.div custom={2} variants={stagger} initial="hidden" animate="visible">
                <AirportAutocomplete
                    value={destination}
                    onChange={setDestination}
                    label="To"
                    placeholder="Destination airport..."
                />
            </motion.div>

            <motion.div custom={3} variants={stagger} initial="hidden" animate="visible">
                <label className="text-sm font-semibold text-foreground/70 mb-2 block">When are you traveling?</label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                        <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 cursor-pointer hover:border-muted-foreground/30 transition-all">
                            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className={`flex-1 text-sm ${date ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                {date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Select date'}
                            </span>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent mode="single"
                            selected={date ? new Date(date + 'T00:00:00') : undefined}
                            onSelect={(d) => { if (d) { setDate(d.toISOString().split('T')[0]); setCalendarOpen(false); } }}
                            disabled={(d) => { const today = new Date(); today.setHours(0, 0, 0, 0); return new Date(d).setHours(0, 0, 0, 0) < today; }}
                        />
                    </PopoverContent>
                </Popover>
            </motion.div>

            <motion.div custom={4} variants={stagger} initial="hidden" animate="visible">
                <label className="text-sm font-semibold text-foreground/70 mb-2 block">Time of day <span className="font-normal text-muted-foreground">(optional)</span></label>
                <div className="flex flex-wrap gap-2">
                    {TIME_WINDOWS.map(tw => (
                        <button key={tw.id} onClick={() => setTimeWindow(tw.id)}
                            className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                                timeWindow === tw.id
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-card text-foreground border-border hover:border-muted-foreground/30'
                            }`}>
                            {tw.label}
                        </button>
                    ))}
                </div>
            </motion.div>

            {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="rounded-2xl px-5 py-4 flex items-start gap-3 bg-destructive/10 border border-destructive/20">
                    <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-destructive text-sm font-medium">{error}</p>
                </motion.div>
            )}

            <motion.div custom={5} variants={stagger} initial="hidden" animate="visible" className="pt-2">
                <button onClick={handleSearch} disabled={!canSearch || loading}
                    className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-semibold transition-all duration-200 ${
                        canSearch && !loading
                            ? 'bg-primary hover:bg-brand-accent text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/20'
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}>
                    {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>
                    ) : (
                        <><Search className="w-4 h-4" /> Search Flights</>
                    )}
                </button>
            </motion.div>
        </div>
    );
}
