import GameCard from "../eventCards/GameCard";

export default function GameWindow({ event }: { event:any[]}) {
    return (
        <section className="event-window">
        <h2>Games</h2>
        <div className="event-window-content">
        {event.map((event) => (
            <GameCard key={event.calendarEventId} event={event} />
        ))}
        </div>
        </section>
    );
}
