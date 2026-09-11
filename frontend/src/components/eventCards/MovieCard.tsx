import { isoToDisplayDate } from "../../utils/dateUtils";

export default function MovieCard({ event }: { event: any }) {
    return (
        <div className="movie-card event-card">
            <h3>{event.title}</h3>
            <p>{isoToDisplayDate(event.releaseDate)}</p>
        </div>
    );
}
