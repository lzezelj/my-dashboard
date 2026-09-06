import type { Events } from "../types/events.ts";

export async function getEvents(): Promise<Events[]> {
    const response = await fetch("http://localhost:3000/api/events");
    if (!response.ok) {
        throw new Error("Failed to fetch events");
    }

    return response.json();
}