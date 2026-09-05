import { useEffect, useState } from "react";
import type { Movies, UpdateMovies } from "../types/movies";
import { createMovie, deleteMovie, getMovies, updateMovie } from "../services/movies.api.ts";
import {dateToISOString, isoToDateInputValue, isoToDisplayDate} from "../utils/dateUtils";

export default function Movies() {
    const [movies, setMovies] = useState<Movies[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [editTitle, setEditTitle] = useState("");
    const [editReleaseDate, setEditReleaseDate] = useState(new Date().toISOString().split("T")[0]);
    const [editingMovieId, setEditingMovieId] = useState<number | null>(null);
    const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split("T")[0]);
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!title.trim()) {
            setError("Title cannot be empty.");
            return;
        }

        try {
            const newMovie = await createMovie({ title, releaseDate:dateToISOString(releaseDate) });
            setMovies((currentMovies) => [...currentMovies, newMovie]);
            setTitle("");
            setReleaseDate(new Date().toISOString().split("T")[0]);
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
                        setEditReleaseDate(isoToDateInputValue(movie.releaseDate));
                    }}>
                         {editingMovieId === movie.id ? "Cancel" : "Edit"}
                    </button>
                    {editingMovieId === movie.id && (
                        <form onSubmit={(event) => {event.preventDefault(); handleUpdate(movie.id, { title:editTitle, releaseDate: dateToISOString(editReleaseDate) }); setEditingMovieId(null);}} >
                            <input name="title"  value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                            <input name="releaseDate" type="date" value={editReleaseDate} onChange={(e) => setEditReleaseDate(e.target.value)} />
                            <button type="submit">Update Movie</button>
                        </form>
                    )}
                    <p>
                        {movie.title}
                    </p>     
                    <p>
                        {isoToDisplayDate(movie.releaseDate)}
                    </p>
                    
                    <button type="button" onClick={() => handleDelete(movie.id)}>
                        Delete Movie
                    </button>
                </div>
            ))}
            <form onSubmit={handleSubmit}>
                <input name="title" placeholder="Enter a movie" value={title} onChange={(e) => setTitle(e.target.value)} />
                <input name="releaseDate" type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
                <button type="submit">Create Movie</button>
            </form>
        </div>
       
    );
}