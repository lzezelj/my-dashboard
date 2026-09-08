import { isoToDisplayDate } from "../../utils/dateUtils";

export default function BirthdayCard({ event }: { event: any }) {
    return (
        <div className="birthday-card">
            <h3>{event.name}</h3>
            <p>{isoToDisplayDate(event.date)}</p>
        </div>
    );
}