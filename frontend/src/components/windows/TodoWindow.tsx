import TodoCard from "../eventCards/TodoCard";

export default function TodoWindow({ event }: { event:any[]}) {
    return (
        <section className="event-window">
        <h2>Todos</h2>
        <div className="event-window-content">
        {event.map((event) => (
            <TodoCard key={event.calendarEventId} event={event} />
        ))}
        </div>
        </section>
    );
}
