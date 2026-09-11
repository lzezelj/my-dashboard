import { isoToDisplayDate } from "../../utils/dateUtils";
import { getEventTimePeriod } from "../../utils/eventTimePeriod";

export default function BirthdayCard({ event }: { event: any }) {
    const date = new Date(event.date);
    const now = new Date();
    if (date.getMonth() < now.getMonth() || (date.getMonth() === now.getMonth() && date.getDate() < now.getDate())) {
        date.setFullYear(now.getFullYear() + 1);
    }


    return (
        <div className={`birthday-card event-card event-${getEventTimePeriod(event.calendarDate)}`}>
            <h3>{event.name}</h3>
            <p>{isoToDisplayDate(date.toISOString())}</p>
        </div>
    );
}
