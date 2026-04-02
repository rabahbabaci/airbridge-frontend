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
    const days = Math.floor(h / 24);
    const remH = h % 24;
    if (days < 7) return `Leave in ${days} day${days > 1 ? 's' : ''}, ${remH} hour${remH !== 1 ? 's' : ''}`;
    const d = new Date(leaveAtISO);
    const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `Leave on ${dateStr} at ${timeStr}`;
}

export function parseTimeToDate(localTimeStr) {
    if (!localTimeStr) return null;
    const match = localTimeStr.match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
    if (!match) return null;
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]), parseInt(match[4]), parseInt(match[5]));
}
