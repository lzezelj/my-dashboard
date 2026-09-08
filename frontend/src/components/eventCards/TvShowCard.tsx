export default function TvShowCard({ event }: { event: any }) {
    return (
        <div className="tv-show-card">
            <h3>{event.title}</h3>
            <p>{event.releaseDate}</p>
        </div>
    );
}