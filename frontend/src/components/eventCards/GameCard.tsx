import { isoToDisplayDate } from "../../utils/dateUtils";

export default function GameCard({ event }: { event: any }) {
    return (
        <div className="game-card event-card">
            <h3>{event.title}</h3>
            <p>{isoToDisplayDate(event.date)}</p>
        </div>
    );
}
