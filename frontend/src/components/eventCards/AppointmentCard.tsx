import { isoToDisplayDate, isoToTimeInputValue } from "../../utils/dateUtils";

export default function AppointmentCard({ event }: { event: any }) {
    return (
        <div className="appointment-card event-card">
            <h3>{event.title}</h3>
            <p>{isoToDisplayDate(event.startTime)}</p>
            <p>{isoToTimeInputValue(event.startTime)} - {isoToTimeInputValue(event.endTime)}</p>
        </div>
    );
}