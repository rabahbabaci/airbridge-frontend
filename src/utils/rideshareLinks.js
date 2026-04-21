/**
 * Rideshare deep-link builders + sessionStorage for the user's chosen
 * provider. Results screen (brief §4.5) and future Active Trip rideshare
 * cards share these.
 *
 * Native (Capacitor) URIs target the Uber/Lyft app schemes; web URIs
 * fall back to m.uber.com and lyft.com which also open the native app
 * if installed on iOS/Android and otherwise land on the web booking
 * flow.
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
