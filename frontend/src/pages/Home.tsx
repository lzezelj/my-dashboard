import { useEffect, useState } from "react";
import type { CalendarEvent, SourceEvents } from "../types/events";
import { getCalendarEvents, getSourceEvents } from "../services/home.api";
import { isoToDisplayDate } from "../utils/dateUtils";
import CardSwitch from "../components/eventCards/CardSwitch";
import Calendar from "../components/Calendar";

export default function Home() {
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [sourceEvents, setSourceEvents] = useState<SourceEvents[]>([]);
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
        async function loadSourceEvents() {
            try {
                const data = await getSourceEvents();
                setSourceEvents(data);
            } catch (error) {
                console.error("Could not load source events.", error);
            }
        }
        loadSourceEvents();
            }, []);
        
    return (
        <div>
            <h1>Home</h1>
            <Calendar></Calendar>
            <ul>
                {calendarEvents.map((event) => (
                   <div>
                    {event.title } 
                    {isoToDisplayDate(event.date)} 
                    {event.id} 
                   </div>
                ))}
            </ul>
            
        </div>
    );
}