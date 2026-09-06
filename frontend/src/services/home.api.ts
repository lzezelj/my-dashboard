import type { CalendarEvent } from "../types/events";

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
    const response = await fetch("http://localhost:3000/api/events");
    if (!response.ok) {
        throw new Error("Failed to fetch events");
    }

    return response.json();
}
export async function getFullEvent(id: string): Promise<CalendarEvent> {
    const response = await fetch(`http://localhost:3000/api/events/${id}`);
    if (!response.ok) {
        throw new Error("Failed to fetch event");
    }

    return response.json();
}