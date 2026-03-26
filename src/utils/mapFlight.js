/**
 * Maps a raw flight object from the backend API into the shape used by Engine.jsx UI.
 */
export function mapFlight(f) {
    return {
        flight_number: f.flight_number,
        departure_time: f.departure_time_local,
        arrival_time: f.arrival_time_local,
        origin_code: f.origin_iata,
        origin_name: f.origin_name,
        destination_code: f.destination_iata,
        destination_name: f.destination_name,
        departure_terminal: f.departure_terminal,
        departure_gate: f.departure_gate,
        arrival_terminal: f.arrival_terminal,
        status: f.status,
        aircraft_model: f.aircraft_model,
        departure_time_utc: f.departure_time_utc,
        departed: f.departed ?? false,
        canceled: f.canceled ?? false,
        catchable: f.catchable ?? true,
        time_warning: f.time_warning ?? null,
        is_boarding: f.is_boarding ?? false,
        revised_departure_local: f.revised_departure_local,
        is_delayed: f.is_delayed ?? false,
        scheduled_departure_local: f.scheduled_departure_local,
        terminal: f.departure_terminal ? `Terminal ${f.departure_terminal}` : 'Terminal TBD',
        airline_name: f.airline_name || '',
    };
}

/**
 * Maps an array of raw flight objects.
 */
export function mapFlights(flights) {
    return (flights || []).map(mapFlight);
}
