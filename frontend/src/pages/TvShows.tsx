import { useEffect, useState } from "react";
import type {  TvShows, UpdateTvShows  } from "../types/tv_shows";
import { createTvShow, getTvShows, updateTvShow, deleteTvShow} from "../services/tv_shows.api.ts";

export default function TvShows() {
    const [tvShows, setTvShows] = useState<TvShows[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [editTitle, setEditTitle] = useState("");
    const [editRelease, setEditRelease] = useState(new Date().toISOString().split("T")[0]);
    const [editingTvShowId, setEditingTvShowId] = useState<number | null>(null);
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
            const newTvShow = await createTvShow({ title, released: new Date(released) });
            setTvShows((currentTvShows) => [...currentTvShows, newTvShow]);
            setTitle("");
            setError("");
            setReleased(new Date().toISOString().split("T")[0]);
        } catch (error) {
            setError("Could not create TV show.");
        }
    }
    async function handleUpdate(id: number, changes: UpdateTvShows) {
        try {
            const updatedTvShow = await updateTvShow(id, changes);
            setTvShows((currentTvShows) =>
                currentTvShows.map((tvShow) =>
                    tvShow.id === id ? updatedTvShow : tvShow
                )
            );
        } catch (error) {
            setError("Could not update TV show.");
        }
    }
    async function handleDelete(id: number) {
        try {
            await deleteTvShow(id);
            setTvShows((currentTvShows) => currentTvShows.filter((tvShow) => tvShow.id !== id));
        } catch (error) {
            setError("Could not delete TV show.");
        }
    }


    useEffect(() => {
        async function loadTvShows() {
            try {
                const data = await getTvShows();
                setTvShows(data);
            } catch (error) {
                setError("Could not load TV shows.");
            } finally {
                setLoading(false);
            }
        }

        loadTvShows();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div>
            <h1>TV Shows</h1>

            {tvShows.map((tvShow) => (
                <div key={tvShow.id}>
                    <button type="button" onClick={() => {
                        setEditingTvShowId(editingTvShowId === tvShow.id ? null : tvShow.id);
                        setEditTitle(tvShow.title);
                        setEditRelease(tvShow.released.toISOString().split("T")[0]);
                    }}>
                         {editingTvShowId === tvShow.id ? "Cancel" : "Edit"}
                    </button>
                    {editingTvShowId === tvShow.id && (
                        <form onSubmit={(event) => {event.preventDefault(); handleUpdate(tvShow.id, { title:editTitle, released: new Date(editRelease) }); setEditingTvShowId(null);}} >
                            <input name="title"  value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                            <input name="released" type="date" value={editRelease} onChange={(e) => setEditRelease(e.target.value)} />
                            <button type="submit">Update TV Show</button>
                        </form>
                    )}
                    <p>
                        {tvShow.title}
                    </p>     
                    <p>
                        {convertedDate(tvShow.released)}
                    </p>
                    
                    <button type="button" onClick={() => handleDelete(tvShow.id)}>
                        Delete TV Show
                    </button>
                </div>
            ))}
            <form onSubmit={handleSubmit}>
                <input name="title" placeholder="Enter a TV show" value={title} onChange={(e) => setTitle(e.target.value)} />
                <input name="released" type="date" value={released} onChange={(e) => setReleased(e.target.value)} />
                <button type="submit">Create TV Show</button>
            </form>
        </div>
       
    );
}