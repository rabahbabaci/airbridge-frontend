export function shortCity(name) {
    if (!name) return '';
    return name.split(/[\s-]+/).slice(0, 2).join(' ');
}

export function formatLocalTime(timeStr) {
    if (!timeStr) return '';
    const match = timeStr.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}):(\d{2})/);
    if (!match) return timeStr;
    const hours = parseInt(match[2]);
    const minutes = match[3];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${h12}:${minutes} ${ampm}`;
}

export function parseTimeToDate(localTimeStr) {
    if (!localTimeStr) return null;
    const match = localTimeStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
    if (!match) return null;
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]), parseInt(match[4]), parseInt(match[5]));
}
