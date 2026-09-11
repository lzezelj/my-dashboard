import { isoToDisplayDate, isoToTimeInputValue } from "../../utils/dateUtils";
import { getEventTimePeriod } from "../../utils/eventTimePeriod";

export default function AppointmentCard({ event }: { event: any }) {
    return (
        <div className={`appointment-card event-card event-${getEventTimePeriod(event.calendarDate)}`}>
            <h3>{event.title}</h3>
            <p>{isoToDisplayDate(event.startTime)}</p>
            <p>{isoToTimeInputValue(event.startTime)} - {isoToTimeInputValue(event.endTime)}</p>
        </div>
    );
}
