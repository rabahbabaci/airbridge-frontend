import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
    Plane, Search, AlertCircle, CheckCircle2, Calendar,
    Sparkles, Loader2,
} from 'lucide-react';

import RouteSearchForm from './RouteSearchForm';
import { mapFlights } from '@/utils/mapFlight';
import { shortCity, formatLocalTime, parseTimeToDate } from '@/utils/format';
import { API_BASE } from '@/config';

// ── Animations ──────────────────────────────────────────────────────────────
const pageTransition = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
    exit: { opacity: 0, y: -16, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
};

const stagger = {
    hidden: { opacity: 0, y: 16 },
    visible: (i) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.07, duration: 0.35, ease: [0.4, 0, 0.2, 1] },
    }),
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function todayStr() {
    return new Date().toISOString().split('T')[0];
}

function tomorrowStr() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
}

// ── Component ───────────────────────────────────────────────────────────────
export default function ScreenA({ onFlightConfirmed, authHeaders }) {
    const [inputMode, setInputMode] = useState('flight_number');
    const [flightNumber, setFlightNumber] = useState('');
    const [departureDate, setDepartureDate] = useState(todayStr());
    const [calendarOpen, setCalendarOpen] = useState(false);

    const [searching, setSearching] = useState(false);
    const [flightOptions, setFlightOptions] = useState([]);
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [searchError, setSearchError] = useState(null);

    const canSearch = flightNumber.trim().length > 0 && departureDate.length > 0;

    // Auto-select when a single match arrives
    useEffect(() => {
        if (flightOptions.length === 1 && !searching) {
            const f = flightOptions[0];
            if (!f.departed && !f.canceled && !f.is_boarding) {
                onFlightConfirmed(f, departureDate);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flightOptions, searching]);

    // ── Flight number search ────────────────────────────────────────────────
    async function handleFindFlight() {
        if (!canSearch || searching) return;
        setSearching(true);
        setSelectedFlight(null);
        setSearchError(null);
        try {
            const res = await fetch(
                `${API_BASE}/v1/flights/${encodeURIComponent(flightNumber.trim())}/${departureDate}`,
                { headers: { ...authHeaders } },
            );
            if (!res.ok) {
                setFlightOptions([]);
                setSearchError('Could not look up flights. Please check the flight number and try again.');
                setSearching(false);
                return;
            }
            const data = await res.json();
            setFlightOptions(mapFlights(data.flights));
        } catch {
            setFlightOptions([]);
            setSearchError('Network error — could not reach the server. Please check your connection and try again.');
        }
        setSearching(false);
    }

    // ── Route search callback ───────────────────────────────────────────────
    function handleRouteFlightsFound(flights, meta) {
        if (meta?.date) setDepartureDate(meta.date);
        setFlightOptions(flights);
        setSearching(false);
    }

    // ── Flight card click ───────────────────────────────────────────────────
    function handleFlightClick(f) {
        if (f.departed || f.canceled || f.is_boarding) return;
        setSelectedFlight(f);
    }

    // ── Continue ────────────────────────────────────────────────────────────
    function handleContinue() {
        if (selectedFlight) onFlightConfirmed(selectedFlight, departureDate);
    }

    // ── Date quick-select helpers ───────────────────────────────────────────
    const isToday = departureDate === todayStr();
    const isTomorrow = departureDate === tomorrowStr();

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <motion.div {...pageTransition} className="w-full max-w-md mx-auto">

            {/* ── Header ── */}
            <motion.div custom={0} variants={stagger} initial="hidden" animate="visible" className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/20">
                    <Sparkles className="w-7 h-7 text-primary-foreground" />
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2">Start Your Journey</h1>
                <p className="text-muted-foreground">Never miss a flight again</p>
            </motion.div>

            {/* ── Section 1: Flight Entry ── */}
            <AnimatePresence mode="wait">
                {inputMode === 'flight_number' ? (
                    <motion.div key="fn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="space-y-4">
                            {/* Flight number */}
                            <motion.div custom={1} variants={stagger} initial="hidden" animate="visible">
                                <label className="text-sm font-semibold text-foreground/70 mb-2 block">Flight Number</label>
                                <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                                    <Plane className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <Input
                                        value={flightNumber}
                                        onChange={e => setFlightNumber(e.target.value)}
                                        placeholder="e.g. UA 452"
                                        onKeyDown={e => e.key === 'Enter' && canSearch && handleFindFlight()}
                                        className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 text-sm text-foreground placeholder:text-muted-foreground"
                                    />
                                </div>
                            </motion.div>

                            {/* Date picker */}
                            <motion.div custom={2} variants={stagger} initial="hidden" animate="visible">
                                <label className="text-sm font-semibold text-foreground/70 mb-2 block">When are you traveling?</label>
                                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 cursor-pointer hover:border-muted-foreground/30 transition-all">
                                            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                                            <span className={`flex-1 text-sm ${departureDate ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                                {departureDate
                                                    ? new Date(departureDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                                                    : 'Select date'}
                                            </span>
                                        </div>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <CalendarComponent
                                            mode="single"
                                            selected={departureDate ? new Date(departureDate + 'T00:00:00') : undefined}
                                            onSelect={(date) => { if (date) { setDepartureDate(date.toISOString().split('T')[0]); setCalendarOpen(false); } }}
                                            disabled={(date) => { const today = new Date(); today.setHours(0, 0, 0, 0); return new Date(date).setHours(0, 0, 0, 0) < today; }}
                                        />
                                    </PopoverContent>
                                </Popover>

                                {/* Today / Tomorrow pills */}
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => setDepartureDate(todayStr())}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                                            isToday
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-card text-foreground border-border hover:border-muted-foreground/30'
                                        }`}
                                    >
                                        Today
                                    </button>
                                    <button
                                        onClick={() => setDepartureDate(tomorrowStr())}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                                            isTomorrow
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'bg-card text-foreground border-border hover:border-muted-foreground/30'
                                        }`}
                                    >
                                        Tomorrow
                                    </button>
                                </div>
                            </motion.div>
                        </div>

                        {/* Go button */}
                        <motion.div custom={3} variants={stagger} initial="hidden" animate="visible" className="mt-8">
                            <button
                                onClick={handleFindFlight}
                                disabled={!canSearch || searching}
                                className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-semibold transition-all duration-200 ${
                                    canSearch && !searching
                                        ? 'bg-primary hover:bg-brand-accent text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/20'
                                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                                }`}
                            >
                                {searching ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>
                                ) : (
                                    <><Search className="w-4 h-4" /> Go</>
                                )}
                            </button>
                            <button
                                onClick={() => { setInputMode('route_search'); setFlightOptions([]); setSearchError(null); }}
                                className="w-full text-center text-sm text-muted-foreground hover:text-primary mt-4 transition-colors"
                            >
                                No flight number? Search by route &rarr;
                            </button>
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div key="rs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <RouteSearchForm onFlightsFound={handleRouteFlightsFound} authHeaders={authHeaders} />
                        <motion.div custom={7} variants={stagger} initial="hidden" animate="visible" className="mt-4">
                            <button
                                onClick={() => { setInputMode('flight_number'); setFlightOptions([]); setSearchError(null); }}
                                className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                                Have a flight number? Enter it directly &rarr;
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Section 2: Flight Selection (inline) ── */}
            <AnimatePresence>
                {(searching || flightOptions.length > 0 || searchError) && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="mt-8"
                    >
                        {/* Search context badge */}
                        {flightOptions.length > 0 && !searching && (
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent border border-primary/10 mb-4">
                                <Plane className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span className="text-sm font-semibold text-primary">
                                    {inputMode === 'flight_number' ? flightNumber.toUpperCase() : 'Route search'}
                                </span>
                                {departureDate && (
                                    <span className="text-xs text-primary/70 ml-1">
                                        {new Date(departureDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Error state */}
                        {searchError && !searching && (
                            <div className="rounded-2xl px-5 py-4 mb-4 flex items-start gap-3 bg-destructive/10 border border-destructive/20">
                                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-destructive text-sm font-medium">{searchError}</p>
                                    <button
                                        onClick={handleFindFlight}
                                        className="text-sm text-destructive font-semibold underline mt-1 hover:text-destructive/80"
                                    >
                                        Try again
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Loading skeleton */}
                        {searching && (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <motion.div
                                        key={i}
                                        animate={{ opacity: [0.4, 0.7, 0.4] }}
                                        transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.15 }}
                                        className="h-24 rounded-2xl bg-card border border-border"
                                    />
                                ))}
                                <p className="text-sm text-muted-foreground text-center mt-2">Searching flights...</p>
                            </div>
                        )}

                        {/* Empty state */}
                        {!searching && !searchError && flightOptions.length === 0 && (
                            <div className="text-center py-16">
                                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground font-medium">No flights found</p>
                                <p className="text-sm text-muted-foreground/70 mt-1">Check the flight number and date</p>
                            </div>
                        )}

                        {/* Flight cards */}
                        {!searching && flightOptions.length > 1 && (
                            <>
                                <motion.div initial="hidden" animate="visible" className="space-y-3">
                                    {flightOptions.map((f, i) => {
                                        const isDisabled = f.departed || f.canceled || f.is_boarding;
                                        const flightKey = `${f.flight_number}|${f.departure_time_utc || ''}|${f.origin_code || ''}`;
                                        const selectedKey = selectedFlight
                                            ? `${selectedFlight.flight_number}|${selectedFlight.departure_time_utc || ''}|${selectedFlight.origin_code || ''}`
                                            : null;
                                        const isSelected = selectedKey === flightKey;

                                        return (
                                            <motion.button
                                                key={i}
                                                custom={i}
                                                variants={stagger}
                                                onClick={() => handleFlightClick(f)}
                                                disabled={isDisabled}
                                                className={`w-full text-left rounded-2xl border-2 bg-card px-5 py-4 transition-all duration-200 ${
                                                    isDisabled ? 'opacity-50 cursor-not-allowed border-border' :
                                                    isSelected ? 'border-primary bg-accent/50 shadow-md shadow-primary/10' :
                                                    'border-border hover:border-muted-foreground/30 hover:shadow-sm'
                                                }`}
                                                style={{ borderLeftWidth: '4px', borderLeftColor: isDisabled ? 'hsl(var(--border))' : 'hsl(var(--primary))' }}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-foreground">{f.flight_number}</span>
                                                            {f.airline_name && <span className="text-xs text-muted-foreground">{f.airline_name}</span>}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground flex-wrap">
                                                            <span>Arrival: {formatLocalTime(f.arrival_time)}</span>
                                                            <span>&middot;</span>
                                                            <span className="text-primary font-medium">
                                                                {shortCity(f.origin_name) || f.origin_code}{' '}
                                                                <span className="font-mono font-bold bg-accent text-primary px-1 py-0.5 rounded text-[10px]">{f.origin_code}</span>
                                                                {' → '}
                                                                {shortCity(f.destination_name) || f.destination_code}{' '}
                                                                <span className="font-mono font-bold bg-accent text-primary px-1 py-0.5 rounded text-[10px]">{f.destination_code}</span>
                                                                {' · '}{f.terminal}
                                                                {f.departure_gate ? ` · Gate ${f.departure_gate}` : ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-lg font-black text-foreground">{formatLocalTime(f.departure_time)}</p>
                                                        <p className="text-[11px] text-muted-foreground font-medium">Departure</p>
                                                    </div>
                                                </div>

                                                {/* Status badges */}
                                                {f.departed && <span className="inline-block mt-2 text-xs font-bold text-destructive bg-destructive/10 px-2.5 py-1 rounded-full border border-destructive/20">Departed</span>}
                                                {f.is_boarding && <span className="inline-block mt-2 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">Boarding Now</span>}
                                                {f.canceled && <span className="inline-block mt-2 text-xs font-bold text-destructive bg-destructive/10 px-2.5 py-1 rounded-full border border-destructive/20">Canceled</span>}
                                                {f.is_delayed && f.revised_departure_local && (() => {
                                                    const scheduled = parseTimeToDate(f.departure_time);
                                                    const revised = parseTimeToDate(f.revised_departure_local);
                                                    if (scheduled && revised && revised > scheduled)
                                                        return <p className="text-xs text-amber-600 font-medium mt-2">Delayed — now {formatLocalTime(f.revised_departure_local)}</p>;
                                                    return null;
                                                })()}
                                                {f.time_warning && !isDisabled && <p className="text-xs text-amber-600 font-medium mt-2">{f.time_warning}</p>}

                                                {isSelected && !isDisabled && (
                                                    <div className="flex items-center gap-1.5 mt-2">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                                                        <span className="text-xs font-semibold text-primary">Selected</span>
                                                    </div>
                                                )}
                                            </motion.button>
                                        );
                                    })}
                                </motion.div>

                                {/* Continue button */}
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6">
                                    <button
                                        onClick={handleContinue}
                                        disabled={!selectedFlight}
                                        className={`w-full py-4 rounded-2xl text-base font-semibold transition-all duration-200 ${
                                            selectedFlight
                                                ? 'bg-primary hover:bg-brand-accent text-primary-foreground shadow-lg shadow-primary/20'
                                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                                        }`}
                                    >
                                        Continue
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
