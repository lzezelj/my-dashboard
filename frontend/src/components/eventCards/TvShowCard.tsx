import { isoToDisplayDate } from "../../utils/dateUtils";

export default function TvShowCard({ event }: { event: any }) {
    return (
        <div className="tv-show-card event-card">
            <h3>{event.title}</h3>
            <p>{isoToDisplayDate(event.releaseDate)}</p>
        </div>
    );
}
