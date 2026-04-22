/**
 * Logomark — the composed AirBridge mark (Lucide Plane + Lucide Clock
 * badge on an indigo rounded-square background).
 *
 * This component mirrors the composition in public/favicon.svg so the
 * in-app logomark, the browser favicon, and the iOS home-screen icon
 * all share one visual family. Only point of truth for the composition
 * — TabScreenHeader and any other logo-rendering surface should import
 * this rather than reimplementing the plane-plus-clock layout.
 *
 * Size accepts any pixel value. At small sizes (~22px as used in
 * TabScreenHeader), the clock becomes a ~7-8px dot — accepted for
 * brand consistency with the favicon/iOS-icon composition.
 *
 * Colors are fixed: indigo background (--c-brand-primary = #4F3FD3,
 * inlined here so the SVG renders consistently outside React trees)
 * and white glyphs. Callers that need a different color treatment
 * should render their own SVG.
 */
export default function Logomark({ size = 40, className = '', ...rest }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1024 1024"
            width={size}
            height={size}
            className={className}
            aria-hidden="true"
            focusable="false"
            {...rest}
        >
            <rect width="1024" height="1024" rx="184" fill="#4F3FD3" />
            <g transform="translate(96 96) scale(25)">
                <path
                    d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"
                    fill="#FFFFFF"
                    stroke="#FFFFFF"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </g>
            <g transform="translate(628 628) scale(14)">
                <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <polyline
                    points="12 6 12 12 16 14"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </g>
        </svg>
    );
}
