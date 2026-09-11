import { isoToDisplayDate } from "../../utils/dateUtils";

export default function TodoCard({ event }: { event: any }) {
    return (
        <div className="todo-card event-card">
            <h3>{event.title}</h3>
            <p>{isoToDisplayDate(event.deadline)}</p>
            <p className={`todo-status${event.completed ? " completed" : ""}`}>
                {event.completed ? "Completed" : "Not completed"}
            </p>
        </div>
    );
}
