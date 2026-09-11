import TodoCard from "../eventCards/TodoCard";

export default function TodoWindow({ event, onToggleTodoComplete }: { event:any[]; onToggleTodoComplete: (todoId: number, completed: boolean) => void }) {
    return (
        <section className="event-window">
        <h2>Todos</h2>
        <div className="event-window-content">
        {event.map((event) => (
            <TodoCard key={event.calendarEventId} event={event} onToggleComplete={onToggleTodoComplete} />
        ))}
        </div>
        </section>
    );
}
