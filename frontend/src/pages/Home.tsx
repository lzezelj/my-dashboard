import { useEffect, useState } from "react";
import type { SourceEvents } from "../types/events";
import { getSourceEvents } from "../services/home.api";
import Calendar from "../components/Calendar";
import AppointmentWindow from "../components/windows/AppointmentWindow";
import MovieWindow from "../components/windows/MovieWindow";
import EventWindow from "../components/windows/Events";
import BirthdayWindow from "../components/windows/BirthdayWindow";
import GameWindow from "../components/windows/GameWindow";
import TodoWindow from "../components/windows/TodoWindow";
import TvShowWindow from "../components/windows/TvShowWindow";


export default function Home() {
    const [sourceEvents, setSourceEvents] = useState<SourceEvents[]>([]);   
    const [dashboardTime] = useState(() => Date.now());
    const upcomingSourceEvents = sourceEvents.filter(
        (event) => new Date(event.calendarDate).getTime() >= dashboardTime
    );
    const movieEvents=upcomingSourceEvents.filter((event)=>event.eventType==="MOVIE");
    const appointmentEvents=upcomingSourceEvents.filter((event)=>event.eventType==="APPOINTMENT");
    const birthdayEvents=upcomingSourceEvents.filter((event)=>event.eventType==="BIRTHDAY");
    const gameEvents=upcomingSourceEvents.filter((event)=>event.eventType==="GAME");
    const todoEvents=upcomingSourceEvents.filter((event)=>event.eventType==="TODO");
    const tvShowEvents=upcomingSourceEvents.filter((event)=>event.eventType==="TV_SHOW");
    useEffect(() => {
        async function loadSourceEvents() {
            try {
                const data = await getSourceEvents();
                setSourceEvents([...data].sort(
                    (firstEvent, secondEvent) =>
                        new Date(firstEvent.calendarDate).getTime()
                        - new Date(secondEvent.calendarDate).getTime()
                ));
            } catch (error) {
                console.error("Could not load source events.", error);
            }
        }
        loadSourceEvents();
            }, []);
    return (
        <main className="home-dashboard">
            <h1>Home</h1>
            <Calendar></Calendar>
            <section className="event-windows">
                <EventWindow event={upcomingSourceEvents} />
                <AppointmentWindow event={appointmentEvents} />
                <BirthdayWindow event={birthdayEvents} />
                <GameWindow event={gameEvents} />
                <MovieWindow event={movieEvents} />
                <TodoWindow event={todoEvents}/>
                <TvShowWindow event={tvShowEvents} />
            </section>
        </main>
    );
}
