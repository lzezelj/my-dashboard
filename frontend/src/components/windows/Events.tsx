import CardSwitch from "../eventCards/CardSwitch";
import formatEventType from "../../utils/formatEventType";
import { getEventTimePeriod } from "../../utils/eventTimePeriod";

export default function EventWindow({ event, onToggleTodoComplete }: { event: any[]; onToggleTodoComplete: (todoId: number, completed: boolean) => void }) {
    return (
        <section className="event-window event-window-large">
            <h2>All events</h2>
            <div className="event-window-content">
                {event.map((event) => (
                    <div
                        key={event.calendarEventId}
                        className={`all-event-entry event-${getEventTimePeriod(event.calendarDate)}${event.eventType === "TODO" && event.completed ? " todo-completed" : ""}`}
                    >
                        <p className="event-type">{formatEventType(event.eventType)}</p>
                        <CardSwitch event={event} onToggleTodoComplete={onToggleTodoComplete} />
                    </div>
                ))}

            </div>
        </section>
    );
}
