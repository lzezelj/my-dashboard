export default function MovieCard({ event }: { event: any }) {
    return (
        <div className="movie-card">
            <h3>{event.title}</h3>
            <p>{event.releaseDate}</p>
        </div>
    );
}