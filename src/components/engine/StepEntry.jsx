import React from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Plane, Calendar, Search, Sparkles } from 'lucide-react';

import RouteSearchForm from './RouteSearchForm';

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

function todayStr() {
    return new Date().toISOString().split('T')[0];
}

function tomorrowStr() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
}

export default function StepEntry({
    flightNumber, setFlightNumber,
    departureDate, setDepartureDate,
    calendarOpen, setCalendarOpen,
    inputMode, setInputMode,
    canSearch, onFindFlight, onRouteFlightsFound, authHeaders,
    routeOrigin, setRouteOrigin,
    routeDestination, setRouteDestination,
    routeTimeWindow, setRouteTimeWindow,
    lastSearchParams, flightOptions,
}) {
    const isToday = departureDate === todayStr();
    const isTomorrow = departureDate === tomorrowStr();

    return (
        <motion.div key="s1" {...pageTransition} className="w-full max-w-md mx-auto">
            <motion.div custom={0} variants={stagger} initial="hidden" animate="visible" className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/20">
                    <Sparkles className="w-7 h-7 text-primary-foreground" />
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2">Start Your Journey</h1>
                <p className="text-muted-foreground">Never miss a flight again</p>
            </motion.div>

            {inputMode === 'flight_number' ? (
                <>
                    <div className="space-y-4">
                        <motion.div custom={1} variants={stagger} initial="hidden" animate="visible">
                            <label className="text-sm font-semibold text-foreground/70 mb-2 block">Flight Number</label>
                            <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                                <Plane className="w-4 h-4 text-muted-foreground shrink-0" />
                                <Input value={flightNumber} onChange={e => setFlightNumber(e.target.value)}
                                    placeholder="e.g. UA 452"
                                    onKeyDown={e => e.key === 'Enter' && canSearch && onFindFlight()}
                                    className="border-0 p-0 h-auto bg-transparent focus-visible:ring-0 text-sm text-foreground placeholder:text-muted-foreground" />
                            </div>
                        </motion.div>

                        <motion.div custom={2} variants={stagger} initial="hidden" animate="visible">
                            <label className="text-sm font-semibold text-foreground/70 mb-2 block">When are you traveling?</label>
                            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 cursor-pointer hover:border-muted-foreground/30 transition-all">
                                        <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <span className={`flex-1 text-sm ${departureDate ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                            {departureDate ? new Date(departureDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Select date'}
                                        </span>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <CalendarComponent mode="single"
                                        selected={departureDate ? new Date(departureDate + 'T00:00:00') : undefined}
                                        onSelect={(date) => { if (date) { setDepartureDate(date.toISOString().split('T')[0]); setCalendarOpen(false); } }}
                                        disabled={(date) => { const today = new Date(); today.setHours(0, 0, 0, 0); return new Date(date).setHours(0, 0, 0, 0) < today; }}
                                    />
                                </PopoverContent>
                            </Popover>
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => setDepartureDate(todayStr())}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                                        isToday
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-card text-foreground border-border hover:border-muted-foreground/30'
                                    }`}>
                                    Today
                                </button>
                                <button
                                    onClick={() => setDepartureDate(tomorrowStr())}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                                        isTomorrow
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-card text-foreground border-border hover:border-muted-foreground/30'
                                    }`}>
                                    Tomorrow
                                </button>
                            </div>
                        </motion.div>
                    </div>

                    <motion.div custom={3} variants={stagger} initial="hidden" animate="visible" className="mt-8">
                        <button onClick={onFindFlight} disabled={!canSearch}
                            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-semibold transition-all duration-200 ${
                                canSearch
                                    ? 'bg-primary hover:bg-brand-accent text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/20'
                                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                            }`}>
                            <Search className="w-4 h-4" />
                            Select Flight
                        </button>
                        <button onClick={() => setInputMode('route_search')}
                            className="w-full text-center text-sm text-muted-foreground hover:text-primary mt-4 transition-colors">
                            No flight number? Search by route &rarr;
                        </button>
                    </motion.div>
                </>
            ) : (
                <>
                    <RouteSearchForm
                        onFlightsFound={onRouteFlightsFound}
                        authHeaders={authHeaders}
                        origin={routeOrigin} setOrigin={setRouteOrigin}
                        destination={routeDestination} setDestination={setRouteDestination}
                        date={departureDate} setDate={setDepartureDate}
                        timeWindow={routeTimeWindow} setTimeWindow={setRouteTimeWindow}
                        lastSearchParams={lastSearchParams}
                        existingResults={flightOptions}
                    />

                    <motion.div custom={7} variants={stagger} initial="hidden" animate="visible" className="mt-4">
                        <button onClick={() => setInputMode('flight_number')}
                            className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors">
                            Have a flight number? Enter it directly &rarr;
                        </button>
                    </motion.div>
                </>
            )}
        </motion.div>
    );
}
