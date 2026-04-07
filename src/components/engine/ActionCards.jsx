import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Navigation, Map, ExternalLink } from 'lucide-react';
import { track } from '@/utils/analytics';
import { postEvent } from '@/utils/events';
import { isNative } from '@/utils/platform';
import { useAuth } from '@/lib/AuthContext';

const native = isNative();

function buildUberUrl({ homeLat, homeLng, termLat, termLng, airportCode, terminal }) {
    if (native) {
        const dropoffNickname = terminal ? `${airportCode} Terminal ${terminal}` : airportCode;
        return `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${termLat}&dropoff[longitude]=${termLng}&dropoff[nickname]=${encodeURIComponent(dropoffNickname)}`;
    }
    const dropoffNickname = terminal
        ? `${airportCode} Terminal ${terminal}`
        : airportCode;
    return `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${homeLat}&pickup[longitude]=${homeLng}&dropoff[latitude]=${termLat}&dropoff[longitude]=${termLng}&dropoff[nickname]=${encodeURIComponent(dropoffNickname)}`;
}

function buildLyftUrl({ homeLat, homeLng, termLat, termLng }) {
    if (native) {
        return `lyft://ridetype?id=lyft&destination[latitude]=${termLat}&destination[longitude]=${termLng}`;
    }
    return `https://lyft.com/ride?id=lyft&pickup[latitude]=${homeLat}&pickup[longitude]=${homeLng}&destination[latitude]=${termLat}&destination[longitude]=${termLng}`;
}

function buildAppleMapsUrl({ homeLat, homeLng, termLat, termLng, transit }) {
    const dirflg = transit ? 'r' : 'd';
    if (native) {
        const saddr = homeLat != null && homeLng != null ? `saddr=${homeLat},${homeLng}&` : '';
        return `maps://?${saddr}daddr=${termLat},${termLng}&dirflg=${dirflg}`;
    }
    const saddr = homeLat != null && homeLng != null ? `saddr=${homeLat},${homeLng}&` : '';
    return `http://maps.apple.com/?${saddr}daddr=${termLat},${termLng}&dirflg=${dirflg}`;
}

function buildGoogleMapsUrl({ homeLat, homeLng, termLat, termLng, transit }) {
    if (native) {
        const directionsmode = transit ? 'transit' : 'driving';
        return `comgooglemaps://?daddr=${termLat},${termLng}&directionsmode=${directionsmode}`;
    }
    const travelmode = transit ? 'transit' : 'driving';
    const origin = homeLat != null && homeLng != null ? `&origin=${homeLat},${homeLng}` : '';
    return `https://www.google.com/maps/dir/?api=1${origin}&destination=${termLat},${termLng}&travelmode=${travelmode}`;
}

function buildWazeUrl({ termLat, termLng }) {
    if (native) {
        return `waze://?ll=${termLat},${termLng}&navigate=yes`;
    }
    return `https://waze.com/ul?ll=${termLat},${termLng}&navigate=yes`;
}

export default function ActionCards({ recommendation, selectedFlight, transport }) {
    const [rideClicked, setRideClicked] = useState(false);
    const { isPro, token } = useAuth();

    if (!recommendation) return null;
    // Sprint 6 F6.2 — one-tap rideshare/navigation are Pro features.
    if (!isPro) return null;

    const tripId = recommendation.trip_id;

    const termCoords = recommendation.terminal_coordinates;
    const homeCoords = recommendation.home_coordinates;
    const airportCode = selectedFlight?.origin_code || '';
    const terminal = selectedFlight?.departure_terminal || '';
    const isRideshare = transport === 'rideshare';
    const isDriving = transport === 'driving';
    const isTransit = transport === 'train' || transport === 'bus';

    const terminalLabel = terminal
        ? `${airportCode} Terminal ${terminal}`
        : airportCode;

    const showRideshare = isRideshare && termCoords && homeCoords;
    const showNavigation = (isDriving || isTransit) && termCoords;

    if (!showRideshare && !showNavigation) return null;

    const coordData = {
        termLat: termCoords?.lat,
        termLng: termCoords?.lng,
        homeLat: homeCoords?.lat,
        homeLng: homeCoords?.lng,
        airportCode,
        terminal,
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-4">

            {/* Rideshare Card */}
            {showRideshare && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.35 }}
                    className="bg-card rounded-2xl border border-border p-5"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                            <Car className="w-4.5 h-4.5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground text-sm">Book your ride to {terminalLabel}</h3>
                            <p className="text-xs text-muted-foreground">Opens in a new tab</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <a
                            href={buildUberUrl(coordData)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => { track('rideshare_deeplink_tapped', { provider: 'uber' }); postEvent('rideshare_tap', tripId, token); setRideClicked(true); }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border bg-secondary text-foreground hover:border-muted-foreground/30 transition-all"
                        >
                            Uber
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                        </a>
                        <a
                            href={buildLyftUrl(coordData)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => { track('rideshare_deeplink_tapped', { provider: 'lyft' }); postEvent('rideshare_tap', tripId, token); setRideClicked(true); }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border bg-secondary text-foreground hover:border-muted-foreground/30 transition-all"
                        >
                            Lyft
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                        </a>
                    </div>
                    {rideClicked && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-muted-foreground mt-3 text-center"
                        >
                            Ride booked? We're still tracking your trip.
                        </motion.p>
                    )}
                </motion.div>
            )}

            {/* Navigation Card */}
            {showNavigation && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.35 }}
                    className="bg-card rounded-2xl border border-border p-5"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                            <Navigation className="w-4.5 h-4.5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground text-sm">Start navigation to {terminalLabel}</h3>
                            <p className="text-xs text-muted-foreground">Opens in a new tab</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <a
                            href={buildAppleMapsUrl({ ...coordData, transit: isTransit })}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => { track('navigation_deeplink_tapped', { provider: 'apple_maps' }); postEvent('nav_tap', tripId, token); }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border bg-secondary text-foreground hover:border-muted-foreground/30 transition-all"
                        >
                            <Map className="w-3.5 h-3.5" />
                            Apple Maps
                        </a>
                        <a
                            href={buildGoogleMapsUrl({ ...coordData, transit: isTransit })}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => { track('navigation_deeplink_tapped', { provider: 'google_maps' }); postEvent('nav_tap', tripId, token); }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border bg-secondary text-foreground hover:border-muted-foreground/30 transition-all"
                        >
                            Google Maps
                        </a>
                        {!isTransit && (
                            <a
                                href={buildWazeUrl(coordData)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => { track('navigation_deeplink_tapped', { provider: 'waze' }); postEvent('nav_tap', tripId, token); }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border bg-secondary text-foreground hover:border-muted-foreground/30 transition-all"
                            >
                                Waze
                            </a>
                        )}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
