import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { MapPin, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GOOGLE_MAPS_API_KEY } from '@/config';

let scriptLoadPromise = null;

function loadGoogleMapsScript() {
    if (window.google?.maps?.places) return Promise.resolve();
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

const AddressAutocomplete = forwardRef(function AddressAutocomplete(
    { value, onChange, placeholder = 'Enter your departure address', className = '', hasError = false },
    ref
) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [results, setResults] = useState([]);
    const [highlightIdx, setHighlightIdx] = useState(0);
    const [ready, setReady] = useState(false);

    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const serviceRef = useRef(null);
    const sessionTokenRef = useRef(null);
    const geocoderRef = useRef(null);
    const debounceRef = useRef(null);

    useImperativeHandle(ref, () => inputRef.current, []);

    // Load Google Maps script
    useEffect(() => {
        if (!GOOGLE_MAPS_API_KEY) {
            console.warn('VITE_GOOGLE_MAPS_API_KEY is not set — address autocomplete disabled');
            return;
        }
        loadGoogleMapsScript()
            .then(() => {
                serviceRef.current = new window.google.maps.places.AutocompleteService();
                geocoderRef.current = new window.google.maps.Geocoder();
                sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
                setReady(true);
            })
            .catch((err) => {
                console.warn('Google Maps Places failed to load:', err.message);
            });
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    function fetchPredictions(input) {
        if (!serviceRef.current || !input.trim()) {
            setResults([]);
            return;
        }
        serviceRef.current.getPlacePredictions(
            {
                input,
                componentRestrictions: { country: 'us' },
                sessionToken: sessionTokenRef.current,
            },
            (predictions, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
                    setResults(predictions.slice(0, 5));
                } else {
                    setResults([]);
                }
            }
        );
    }

    function handleInputChange(e) {
        const text = e.target.value;
        setQuery(text);
        setOpen(true);
        setHighlightIdx(0);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchPredictions(text), 200);
    }

    function handleSelect(prediction) {
        const address = prediction.description;
        onChange(address);
        setQuery('');
        setOpen(false);
        setResults([]);
        // Refresh session token after selection
        if (window.google?.maps?.places) {
            sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
        }
    }

    function handleClear() {
        onChange('');
        setQuery('');
        setResults([]);
        inputRef.current?.focus();
    }

    function handleKeyDown(e) {
        if (!open || results.length === 0) {
            if (e.key === 'Escape') setOpen(false);
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIdx(i => Math.min(i + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIdx(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            handleSelect(results[highlightIdx]);
        } else if (e.key === 'Escape') {
            setOpen(false);
        }
    }

    return (
        <div ref={containerRef} className={cn('relative', className)}>
            <div className={cn(
                'flex items-center gap-3 bg-card border rounded-2xl px-4 py-3.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all',
                hasError ? 'border-destructive' : 'border-border'
            )}>
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                {value ? (
                    <>
                        <span className="flex-1 text-sm text-foreground font-medium truncate">{value}</span>
                        <button onClick={handleClear} className="text-muted-foreground hover:text-foreground transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onFocus={() => { if (query.trim() && results.length) setOpen(true); }}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                    />
                )}
            </div>

            {open && results.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                    {results.map((p, i) => {
                        const main = p.structured_formatting?.main_text || p.description;
                        const secondary = p.structured_formatting?.secondary_text || '';
                        return (
                            <button key={p.place_id}
                                onMouseDown={() => handleSelect(p)}
                                onMouseEnter={() => setHighlightIdx(i)}
                                className={cn(
                                    'w-full text-left px-4 py-2.5 text-sm transition-colors',
                                    i === highlightIdx ? 'bg-accent text-foreground' : 'text-foreground hover:bg-accent/50'
                                )}>
                                <span className="font-medium">{main}</span>
                                {secondary && <span className="text-muted-foreground"> — {secondary}</span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
});

export default AddressAutocomplete;
