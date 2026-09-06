import { useEffect, useState } from "react";
import type { CalendarEvent } from "../types/events";
import { getCalendarEvents } from "../services/home.api";

export default function Home() {
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    useEffect(() => {
        async function loadEvents() {
                    try {
                        const data = await getCalendarEvents();
                        setCalendarEvents(data);
                    } catch (error) {
                        console.error("Could not load events.", error);
                    }
                }
        
                loadEvents();
            }, []);
    return (
        <div>
            <h1>Home</h1>
            <ul>
                {calendarEvents.map((event) => (
                   <div>
                    {event.title } 
                    {event.date} 
                    {event.id} 
                   </div>
                ))}
            </ul>
        </div>
    );
}