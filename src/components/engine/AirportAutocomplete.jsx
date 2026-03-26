import React, { useState, useRef, useMemo } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import airports from '@/data/airports.json';

export default function AirportAutocomplete({ value, onChange, placeholder, label, className }) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [highlightIdx, setHighlightIdx] = useState(0);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    const selected = useMemo(() => value ? airports.find(a => a.iata === value) : null, [value]);

    const results = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.trim().toLowerCase();
        const matched = airports.filter(a =>
            a.iata.toLowerCase().startsWith(q) ||
            a.city.toLowerCase().includes(q) ||
            a.name.toLowerCase().includes(q)
        );
        return matched.slice(0, 8);
    }, [query]);

    // Close dropdown on outside click
    React.useEffect(() => {
        function handleClick(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    function handleSelect(airport) {
        onChange(airport.iata);
        setQuery('');
        setOpen(false);
    }

    function handleClear() {
        onChange('');
        setQuery('');
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

    const displayValue = selected ? `${selected.iata} — ${selected.city}` : '';

    return (
        <div ref={containerRef} className={cn('relative', className)}>
            {label && <label className="text-sm font-semibold text-foreground/70 mb-2 block">{label}</label>}
            <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                {selected ? (
                    <>
                        <span className="flex-1 text-sm text-foreground font-medium">{displayValue}</span>
                        <button onClick={handleClear} className="text-muted-foreground hover:text-foreground transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setOpen(true); setHighlightIdx(0); }}
                        onFocus={() => { if (query.trim()) setOpen(true); }}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder || 'Search airport...'}
                        className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                    />
                )}
            </div>

            {open && results.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden">
                    {results.map((a, i) => (
                        <button key={a.iata}
                            onMouseDown={() => handleSelect(a)}
                            onMouseEnter={() => setHighlightIdx(i)}
                            className={cn(
                                'w-full text-left px-4 py-2.5 text-sm transition-colors',
                                i === highlightIdx ? 'bg-accent text-foreground' : 'text-foreground hover:bg-accent/50'
                            )}>
                            <span className="font-medium">{a.city}</span>
                            <span className="text-muted-foreground"> — {a.name} </span>
                            <span className="font-semibold text-primary">({a.iata})</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
