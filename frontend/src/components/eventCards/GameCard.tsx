export default function GameCard({ event }: { event: any }) {
    return (
        <div className="game-card">
            <h3>{event.title}</h3>
            <p>{event.date}</p>
        </div>
    );
}