import type { CalendarEvent, SourceEvents } from "../types/events";

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
    const response = await fetch("http://localhost:3000/api/events");
    if (!response.ok) {
        throw new Error("Failed to fetch events");
    }

    return response.json();
}
export async function getSourceEvents(): Promise<SourceEvents[]> {
    const response = await fetch("http://localhost:3000/api/events/source");
    if (!response.ok) {
        throw new Error("Failed to fetch source events");
    }

    return response.json();
}