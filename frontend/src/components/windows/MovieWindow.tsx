import MovieCard from "../eventCards/MovieCard";

export default function MovieWindow({ event }: { event:any[]}) {
    return (
        <section className="event-window">
        <h2>Movies</h2>
        <div className="event-window-content">
        {event.map((event) => (
            <MovieCard key={event.calendarEventId} event={event} />
        ))}
        </div>
        </section>
    );
}
