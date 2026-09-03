import { useEffect, useState } from "react";
import type { Movies, UpdateMovies } from "../types/movies";
import { createMovie, deleteMovie, getMovies, updateMovie } from "../services/movies.api.ts";

export default function Movies() {
    const [movies, setMovies] = useState<Movies[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [editTitle, setEditTitle] = useState("");
    const [editRelease, setEditRelease] = useState(new Date().toISOString().split("T")[0]);
    const [editingMovieId, setEditingMovieId] = useState<number | null>(null);
    const [released, setReleased] = useState(new Date().toISOString().split("T")[0]);
    const convertedDate = (dateString: Date): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!title.trim()) {
            setError("Title cannot be empty.");
            return;
        }

        try {
            const newMovie = await createMovie({ title, released: new Date(released) });
            setMovies((currentMovies) => [...currentMovies, newMovie]);
            setTitle("");
            setReleased(new Date().toISOString().split("T")[0]);
        } catch (error) {
            setError("Could not create movie.");
        }
    }
    async function handleUpdate(id: number, changes: UpdateMovies) {
        try {
            const updatedMovie = await updateMovie(id, changes);
            setMovies((currentMovies) =>
                currentMovies.map((movie) =>
                    movie.id === id ? updatedMovie : movie
                )
            );
        } catch (error) {
            setError("Could not update movie.");
        }
    }
    async function handleDelete(id: number) {
        try {
            await deleteMovie(id);
            setMovies((currentMovies) => currentMovies.filter((movie) => movie.id !== id));
        } catch (error) {
            setError("Could not delete movie.");
        }
    }


    useEffect(() => {
        async function loadMovies() {
            try {
                const data = await getMovies();
                setMovies(data);
            } catch (error) {
                setError("Could not load movies.");
            } finally {
                setLoading(false);
            }
        }

        loadMovies();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div>
            <h1>Movies</h1>

            {movies.map((movie) => (
                <div key={movie.id}>
                    <button type="button" onClick={() => {
                        setEditingMovieId(editingMovieId === movie.id ? null : movie.id);
                        setEditTitle(movie.title);
                        setEditRelease(movie.released.toISOString().split("T")[0]);
                    }}>
                         {editingMovieId === movie.id ? "Cancel" : "Edit"}
                    </button>
                    {editingMovieId === movie.id && (
                        <form onSubmit={(event) => {event.preventDefault(); handleUpdate(movie.id, { title, released: new Date(editRelease) }); setEditingMovieId(null);}} >
                            <input name="title"  value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                            <input name="released" type="date" value={editRelease} onChange={(e) => setEditRelease(e.target.value)} />
                            <button type="submit">Update Movie</button>
                        </form>
                    )}
                    <p>
                        {movie.title}
                    </p>     
                    <p>
                        {convertedDate(movie.released)}
                    </p>
                    
                    <button type="button" onClick={() => handleDelete(movie.id)}>
                        Delete Movie
                    </button>
                </div>
            ))}
            <form onSubmit={handleSubmit}>
                <input name="title" placeholder="Enter a movie" value={title} onChange={(e) => setTitle(e.target.value)} />
                <input name="released" type="date" value={released} onChange={(e) => setReleased(e.target.value)} />
                <button type="submit">Create Movie</button>
            </form>
        </div>
       
    );
}