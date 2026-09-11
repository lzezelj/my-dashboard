import { isoToDisplayDate } from "../../utils/dateUtils";
import { getEventTimePeriod } from "../../utils/eventTimePeriod";

export default function TodoCard({ event, onToggleComplete }: { event: any; onToggleComplete?: (todoId: number, completed: boolean) => void }) {
    return (
        <div className={`todo-card event-card event-${getEventTimePeriod(event.calendarDate)}${event.completed ? " todo-completed" : ""}`}>
            <h3>{event.title}</h3>
            <p>{isoToDisplayDate(event.deadline)}</p>
            <p className={`todo-status${event.completed ? " completed" : ""}`}>
                {event.completed ? "Completed" : "Not completed"}
            </p>
            {onToggleComplete && (
                <button type="button" className="todo-complete-button" onClick={() => onToggleComplete(event.id, !event.completed)}>
                    {event.completed ? "Mark as incomplete" : "Complete todo"}
                </button>
            )}
        </div>
    );
}
