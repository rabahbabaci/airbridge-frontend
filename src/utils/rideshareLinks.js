/**
 * Transport-mode deep-link builders + sessionStorage for the user's chosen
 * rideshare provider. Results screen (brief §4.5) and Active Trip rideshare
 * cards share these. Extended with nav builders (Apple Maps / Google Maps /
 * Waze) so both screens render transport-mode-aware chip rows from one
 * source of truth.
 *
 * Native (Capacitor) URIs target app schemes; web URIs fall back to
 * m.uber.com / lyft.com / maps.apple.com / google.com/maps / waze.com
 * which also open the native app if installed on iOS/Android and
 * otherwise land on the web flow.
 */
import { isNative } from './platform';

export function buildUberUrl({ homeLat, homeLng, termLat, termLng, airportCode, terminal }) {
    const nickname = terminal ? `${airportCode} Terminal ${terminal}` : airportCode;
    if (isNative()) {
        return `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${termLat}&dropoff[longitude]=${termLng}&dropoff[nickname]=${encodeURIComponent(nickname)}`;
    }
    return `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${homeLat}&pickup[longitude]=${homeLng}&dropoff[latitude]=${termLat}&dropoff[longitude]=${termLng}&dropoff[nickname]=${encodeURIComponent(nickname)}`;
}

export function buildLyftUrl({ homeLat, homeLng, termLat, termLng }) {
    if (isNative()) {
        return `lyft://ridetype?id=lyft&destination[latitude]=${termLat}&destination[longitude]=${termLng}`;
    }
    return `https://lyft.com/ride?id=lyft&pickup[latitude]=${homeLat}&pickup[longitude]=${homeLng}&destination[latitude]=${termLat}&destination[longitude]=${termLng}`;
}

/* ── Navigation deep links (drivers + transit) ──────────────────────── */

export function buildAppleMapsUrl({ termLat, termLng, homeLat, homeLng, transit }) {
    const dirflg = transit ? 'r' : 'd';
    const saddr = homeLat != null && homeLng != null ? `saddr=${homeLat},${homeLng}&` : '';
    if (isNative()) return `maps://?${saddr}daddr=${termLat},${termLng}&dirflg=${dirflg}`;
    return `https://maps.apple.com/?${saddr}daddr=${termLat},${termLng}&dirflg=${dirflg}`;
}

export function buildGoogleMapsUrl({ termLat, termLng, homeLat, homeLng, transit }) {
    const travelmode = transit ? 'transit' : 'driving';
    if (isNative()) {
        return `comgooglemaps://?daddr=${termLat},${termLng}&directionsmode=${travelmode}`;
    }
    const origin = homeLat != null && homeLng != null ? `&origin=${homeLat},${homeLng}` : '';
    return `https://www.google.com/maps/dir/?api=1${origin}&destination=${termLat},${termLng}&travelmode=${travelmode}`;
}

export function buildWazeUrl({ termLat, termLng }) {
    if (isNative()) return `waze://?ll=${termLat},${termLng}&navigate=yes`;
    return `https://www.waze.com/ul?ll=${termLat},${termLng}&navigate=yes`;
}

/* ── Rideshare provider sessionStorage (set by Results §4.5) ───────── */
const PROVIDER_KEY = 'airbridge_rideshare_provider';

export function loadRideshareProvider() {
    try {
        const raw = sessionStorage.getItem(PROVIDER_KEY);
        return raw === 'uber' || raw === 'lyft' ? raw : null;
    } catch { return null; }
}

export function saveRideshareProvider(provider) {
    try {
        if (provider === 'uber' || provider === 'lyft') {
            sessionStorage.setItem(PROVIDER_KEY, provider);
        }
    } catch { /* quota / private mode — ignore */ }
}

export function clearRideshareProvider() {
    try { sessionStorage.removeItem(PROVIDER_KEY); } catch { /* ignore */ }
}
