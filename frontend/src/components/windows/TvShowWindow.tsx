import TvShowCard from "../eventCards/TvShowCard";

export default function TvShowWindow({ event }: { event:any[]}) {
    return (
        <section className="event-window">
        <h2>TV shows</h2>
        <div className="event-window-content">
        {event.map((event) => (
            <TvShowCard key={event.calendarEventId} event={event} />
        ))}
        </div>
        </section>
    );
}
