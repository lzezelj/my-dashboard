import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { Movies, UpdateMovies } from "../types/movies";
import { addToCalendar, createMovie, deleteMovie, getMovies, removeFromCalendar, updateMovie } from "../services/movies.api.ts";

import { dateToISOString, isoToDateInputValue, isoToDisplayDate } from "../utils/dateUtils";
import Modal from "../components/Modal";
import useCalendarStatus from "../hooks/useCalendarStatus";
import type { EditOutletContext } from "./Edit";

export default function Movies() {
    const { showToast } = useOutletContext<EditOutletContext>();
    const [movies, setMovies] = useState<Movies[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [editTitle, setEditTitle] = useState("");
    const [editReleaseDate, setEditReleaseDate] = useState(new Date().toISOString().split("T")[0]);
    const [editingMovieId, setEditingMovieId] = useState<number | null>(null);
    const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split("T")[0]);
    const [addToCalendarOnCreate, setAddToCalendarOnCreate] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
    const { calendarSourceIds, refreshCalendarStatus } = useCalendarStatus("MOVIE");
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!title.trim()) {
            setError("Title cannot be empty.");
            return;
        }

        try {
            const newMovie = await createMovie({ title, releaseDate: dateToISOString(releaseDate) });
            setMovies((currentMovies) => [...currentMovies, newMovie]);
            if (addToCalendarOnCreate) {
                await addToCalendar(newMovie.id);
                await refreshCalendarStatus();
            }
            setTitle("");
            setError("");
            setReleaseDate(new Date().toISOString().split("T")[0]);
            setAddToCalendarOnCreate(false);
            showToast("Movie created successfully.");
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
        await handleRemoveFromCalendar(id);
        try {
            await deleteMovie(id);
            setMovies((currentMovies) => currentMovies.filter((movie) => movie.id !== id));
        } catch (error) {
            setError("Could not delete movie.");
        }
    }
    async function handleAddToCalendar(sourceId: number) {
        try {
            await addToCalendar(sourceId);
            await refreshCalendarStatus();
        } catch (error) {
            setError("Could not add movie to calendar.");
        }
    }
    async function handleRemoveFromCalendar(sourceId: number) {
        try {
            await removeFromCalendar(sourceId);
            await refreshCalendarStatus();
        } catch (error) {
            setError("Could not remove movie from calendar.");
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
                        <form onSubmit={(event) => { event.preventDefault(); handleUpdate(movie.id, { title: editTitle, releaseDate: dateToISOString(editReleaseDate) }); setEditingMovieId(null); }} >
                            <label className="form-field">Title<input name="title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} /></label>
                            <label className="form-field">Release date<input name="releaseDate" type="date" value={editReleaseDate} onChange={(e) => setEditReleaseDate(e.target.value)} /></label>
                            {calendarSourceIds.has(movie.id) ? (
                                <><span className="calendar-status">On calendar</span><button type="button" onClick={() => handleRemoveFromCalendar(movie.id)}>Remove from Calendar</button></>
                            ) : <button type="button" onClick={() => handleAddToCalendar(movie.id)}>Add to Calendar</button>}
                            <button type="submit">Update Movie</button>
                        </form>
                    )}
                    <p>
                        {movie.title}
                    </p>
                    <p>
                        {isoToDisplayDate(movie.releaseDate)}
                    </p>

                    <button type="button" className="danger-button" onClick={() => setPendingDeleteId(movie.id)}>
                        Delete Movie
                    </button>
                </div>
            ))}
            <form onSubmit={handleSubmit}>
                <label className="form-field">Movie title<input name="title" placeholder="Enter a movie" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
                <label className="form-field">Release date<input name="releaseDate" min={new Date().toISOString().split("T")[0]} type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} /></label>
                <label className="calendar-checkbox"><input type="checkbox" checked={addToCalendarOnCreate} onChange={(e) => setAddToCalendarOnCreate(e.target.checked)} /> Add to calendar</label>
                <button type="submit">Create Movie</button>
            </form>
            <Modal isOpen={pendingDeleteId !== null} title="Delete movie?" confirmLabel="Delete movie" destructive onCancel={() => setPendingDeleteId(null)} onConfirm={() => { if (pendingDeleteId !== null) { handleDelete(pendingDeleteId); setPendingDeleteId(null); } }}><p>This permanently removes the movie.</p></Modal>
        </div>

    );
}
