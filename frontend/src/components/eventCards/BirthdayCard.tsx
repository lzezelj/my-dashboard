import { isoToDisplayDate } from "../../utils/dateUtils";

export default function BirthdayCard({ event }: { event: any }) {
    const date = new Date(event.date);
    const now = new Date();
    if (date.getMonth() < now.getMonth() || (date.getMonth() === now.getMonth() && date.getDate() < now.getDate())) {
        date.setFullYear(now.getFullYear() + 1);
    }


    return (
        <div className="birthday-card event-card">
            <h3>{event.name}</h3>
            <p>{isoToDisplayDate(date.toISOString())}</p>
        </div>
    );
}
