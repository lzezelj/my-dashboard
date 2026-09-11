export function dateToISOString(date: string): string {
    return new Date(`${date}T00:00:00Z`).toISOString();
}

export function isoToDateInputValue(iso: string): string {
    const date = new Date(iso);

    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function dateTimeToISOString(
    date: string,
    time: string
): string {
    return new Date(`${date}T${time}`).toISOString();
}

export function isoToTimeInputValue(iso: string): string {
    const date = new Date(iso);

    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function isoToDisplayDate(iso: string): string {
    const date = new Date(iso);

    return `${date.getUTCDate()}/${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`;
}

export function getCurrentTime() {
    const now = new Date();

    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function getTimePlusOneMinute() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);

    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}