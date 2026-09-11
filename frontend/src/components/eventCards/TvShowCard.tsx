import { isoToDisplayDate } from "../../utils/dateUtils";
import { getEventTimePeriod } from "../../utils/eventTimePeriod";

export default function TvShowCard({ event }: { event: any }) {
    return (
        <div className={`tv-show-card event-card event-${getEventTimePeriod(event.calendarDate)}`}>
            <h3>{event.title}</h3>
            <p>{isoToDisplayDate(event.releaseDate)}</p>
        </div>
    );
}
