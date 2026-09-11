import { useEffect, useState } from "react";
import type { SourceEvents } from "../types/events";
import { getSourceEvents } from "../services/home.api";
import { updateTodo } from "../services/todos.api";
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
        (event) => {
            const isUpcoming = new Date(event.calendarDate).getTime() >= dashboardTime;
            return isUpcoming;

        }
    );

    const movieEvents = upcomingSourceEvents.filter((event) => event.eventType === "MOVIE");
    const appointmentEvents = upcomingSourceEvents.filter((event) => event.eventType === "APPOINTMENT");
    const birthdayEvents = upcomingSourceEvents.filter((event) => event.eventType === "BIRTHDAY");
    const gameEvents = upcomingSourceEvents.filter((event) => event.eventType === "GAME");
    const todoEvents = upcomingSourceEvents.filter((event) => event.eventType === "TODO");
    const tvShowEvents = upcomingSourceEvents.filter((event) => event.eventType === "TV_SHOW");
    async function handleToggleTodoComplete(todoId: number, completed: boolean) {
        try {
            const updatedTodo = await updateTodo(todoId, { completed });
            setSourceEvents((currentEvents) => currentEvents.map((event) => {
                if (event.eventType !== "TODO" || event.id !== todoId) return event;
                return { ...event, ...updatedTodo };
            }));
        } catch (error) {
            console.error("Could not update todo.", error);
        }
    }
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
            <aside className="event-legend" aria-label="Event colour legend">
                <span><i className="legend-swatch today"></i>Today</span>
                <span><i className="legend-swatch week"></i>This week</span>
                <span><i className="legend-swatch month"></i>This month</span>
                <span><i className="legend-swatch completed"></i>Completed todo</span>
            </aside>
            <section className="event-windows">
                <EventWindow event={upcomingSourceEvents} onToggleTodoComplete={handleToggleTodoComplete} />
                <AppointmentWindow event={appointmentEvents} />
                <BirthdayWindow event={birthdayEvents} />
                <GameWindow event={gameEvents} />
                <MovieWindow event={movieEvents} />
                <TodoWindow event={todoEvents} onToggleTodoComplete={handleToggleTodoComplete} />
                <TvShowWindow event={tvShowEvents} />
            </section>
        </main>
    );
}
