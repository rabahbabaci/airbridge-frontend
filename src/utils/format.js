export function shortCity(name) {
    if (!name) return '';
    return name.split(/[\s-]+/).slice(0, 2).join(' ');
}

export function formatLocalTime(timeStr) {
    if (!timeStr) return '';
    const match = timeStr.match(/(\d{4}-\d{2}-\d{2})[T\s](\d{2}):(\d{2})/);
    if (!match) return timeStr;
    const hours = parseInt(match[2]);
    const minutes = match[3];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${h12}:${minutes} ${ampm}`;
}

export function formatDuration(minutes) {
    if (minutes == null) return '';
    const m = Math.round(minutes);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    const r = m % 60;
    if (r === 0) return `${h} hr`;
    return `${h} hr ${r} min`;
}

export function formatCountdownText(leaveAtISO) {
    const diffMs = new Date(leaveAtISO) - Date.now();
    if (diffMs <= 0) return null; // past — caller handles this
    const totalMin = Math.floor(diffMs / 60000);
    if (totalMin < 60) return `Leave in ${totalMin}m`;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h < 24) return `Leave in ${h}h ${m}m`;
    // ── More than a day out: stop running a countdown, show the date instead.
    const d = new Date(leaveAtISO);
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (h >= 72) {
        // > 3 days: date only
        return `Leave on ${dateStr}`;
    }
    // 24–72h: date + time
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `Leave on ${dateStr} at ${timeStr}`;
}

// Second-resolution variant for Active Trip's hero countdown. Seconds
// are always rendered now (ticking "live" signal). Format adapts to
// magnitude: "Xh Ym Zs" / "Xm Ys" / "Xs". When leaveAt is >= 24 hours
// out we still delegate to formatCountdownText so the "Leave on
// {date}" form takes over — ticking seconds across a multi-day gap
// would be noise, not urgency.
export function formatCountdownTextWithSeconds(leaveAtISO) {
    const diffMs = new Date(leaveAtISO) - Date.now();
    if (diffMs <= 0) return null;
    const totalSec = Math.floor(diffMs / 1000);
    if (totalSec < 60) return `Leave in ${totalSec}s`;
    const totalMin = Math.floor(totalSec / 60);
    if (totalMin < 60) {
        const m = totalMin;
        const s = totalSec % 60;
        return `Leave in ${m}m ${s}s`;
    }
    const h = Math.floor(totalMin / 60);
    if (h < 24) {
        const m = totalMin % 60;
        const s = totalSec % 60;
        return `Leave in ${h}h ${m}m ${s}s`;
    }
    // >= 24h: defer to the plain formatter which switches to "Leave on
    // {date}" — a ticking seconds readout across days is noise.
    return formatCountdownText(leaveAtISO);
}

// Structured countdown breakdown. Lets consumers render each H / M / S
// numeric group in its own fixed-width slot so the unit letters don't
// shift horizontally as digits tick (0→9 vs 10→59 vs 100+). Returns
// { totalSec, isDate, h, m, s } when in the live-countdown window, or
// { totalSec, isDate: true, text } for >= 24h which shows a date.
export function parseCountdown(leaveAtISO) {
    const diffMs = new Date(leaveAtISO) - Date.now();
    if (diffMs <= 0) return { totalSec: 0, isDate: false, h: 0, m: 0, s: 0 };
    const totalSec = Math.floor(diffMs / 1000);
    if (totalSec >= 24 * 3600) {
        return { totalSec, isDate: true, text: formatCountdownText(leaveAtISO) };
    }
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return { totalSec, isDate: false, h, m, s };
}

export function parseTimeToDate(localTimeStr) {
    if (!localTimeStr) return null;
    const match = localTimeStr.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
    if (!match) return null;
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]), parseInt(match[4]), parseInt(match[5]));
}
