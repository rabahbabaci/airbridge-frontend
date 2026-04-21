/**
 * Google Maps geocoding helpers — loads the JS SDK on demand and exposes a
 * thin reverse-geocoder for the Setup screen's "Use my current location"
 * affordance (brief §4.4, rule 16).
 *
 * The script loader mirrors the one inside AddressAutocomplete.jsx but is
 * module-local; both loaders guard on `window.google?.maps` so the second
 * caller sees the script already present and resolves immediately.
 */
import { GOOGLE_MAPS_API_KEY } from '@/config';

let scriptLoadPromise = null;

export function loadGoogleMaps() {
    if (window.google?.maps) return Promise.resolve();
    if (!GOOGLE_MAPS_API_KEY) {
        return Promise.reject(new Error('Google Maps API key missing'));
    }
    if (scriptLoadPromise) return scriptLoadPromise;

    scriptLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = () => {
            scriptLoadPromise = null;
            reject(new Error('Failed to load Google Maps script'));
        };
        document.head.appendChild(script);
    });
    return scriptLoadPromise;
}

export async function reverseGeocode(lat, lng) {
    await loadGoogleMaps();
    const geocoder = new window.google.maps.Geocoder();
    return new Promise((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
                resolve(results[0].formatted_address);
            } else {
                reject(new Error(`Reverse geocode failed: ${status}`));
            }
        });
    });
}

export function getCurrentPosition(options = { timeout: 10000, enableHighAccuracy: false }) {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
}
