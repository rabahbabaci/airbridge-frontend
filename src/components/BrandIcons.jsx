import { siUber, siLyft, siWaze, siGooglemaps } from 'simple-icons';

// Real brand marks sourced from simple-icons (authoritative brand glyphs,
// brand-color hex, updated by the simple-icons maintainers). Each icon
// renders its original path data filled with the provider's primary brand
// color so users recognise the mark at a glance instead of parsing a text
// stylisation. Apple Maps is not in simple-icons (Apple ships no public
// brand mark for it separately) — we render a lightweight compass glyph
// in the Apple Maps app colour palette instead.
//
// Sizing contract: every icon ships a square viewBox 0 0 24 24 and
// accepts a `size` prop in px.

function SimpleIconGlyph({ icon, size, color }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label={icon.title}
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill={color || `#${icon.hex}`}
        >
            <title>{icon.title}</title>
            <path d={icon.path} />
        </svg>
    );
}

export function UberIcon({ size = 24, color }) {
    return <SimpleIconGlyph icon={siUber} size={size} color={color} />;
}

export function LyftIcon({ size = 24, color }) {
    return <SimpleIconGlyph icon={siLyft} size={size} color={color} />;
}

export function WazeIcon({ size = 24, color }) {
    return <SimpleIconGlyph icon={siWaze} size={size} color={color} />;
}

// simple-icons ships Google Maps as a monochrome Google-blue pin. The real
// brand mark is multi-coloured; rendering it single-tone reads as a
// generic pin and loses the recognisability we're going for. Wrap the
// simple-icons path on top of the classic red teardrop so the silhouette
// matches Google Maps at a glance while keeping the brand-accurate glyph.
export function GoogleMapsIcon({ size = 24 }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Google Maps"
            viewBox="0 0 24 24"
            width={size}
            height={size}
        >
            <title>Google Maps</title>
            <path
                d="M12 2C7.58 2 4 5.58 4 10c0 1.54.44 3.02 1.22 4.36L12 22l6.78-7.64C19.56 13.02 20 11.54 20 10c0-4.42-3.58-8-8-8z"
                fill="#EA4335"
            />
            <circle cx="12" cy="10" r="3.3" fill="#FFFFFF" />
            <circle cx="12" cy="10" r="2.1" fill={`#${siGooglemaps.hex}`} />
        </svg>
    );
}

// Apple Maps: stylised compass needle (red N / grey S) on a light square
// matching Apple Maps' app-icon background family. Not sourced from
// simple-icons — see module header.
export function AppleMapsIcon({ size = 24 }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Apple Maps"
            viewBox="0 0 24 24"
            width={size}
            height={size}
        >
            <title>Apple Maps</title>
            <rect width="24" height="24" rx="5" fill="#F2F2F7" />
            <circle cx="12" cy="12" r="7" fill="#FFFFFF" stroke="#D1D1D6" strokeWidth="0.5" />
            <path d="M12 4 L14 12 L12 11 L10 12 Z" fill="#FF3B30" />
            <path d="M12 20 L10 12 L12 13 L14 12 Z" fill="#8E8E93" />
        </svg>
    );
}
