import { useEffect, useState } from "react";
import type {  TvShows, UpdateTvShows  } from "../types/tv_shows";
import { createTvShow, getTvShows, updateTvShow, deleteTvShow, addToCalendar, removeFromCalendar} from "../services/tv_shows.api.ts";
import {dateToISOString, isoToDateInputValue, isoToDisplayDate} from "../utils/dateUtils";
import Modal from "../components/Modal";
import useCalendarStatus from "../hooks/useCalendarStatus";

export default function TvShows() {
    const [tvShows, setTvShows] = useState<TvShows[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [editTitle, setEditTitle] = useState("");
    const [editReleaseDate, setEditReleaseDate] = useState(new Date().toISOString().split("T")[0]);
    const [editingTvShowId, setEditingTvShowId] = useState<number | null>(null);
    const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split("T")[0]);
    const [addToCalendarOnCreate, setAddToCalendarOnCreate] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
    const { calendarSourceIds, refreshCalendarStatus } = useCalendarStatus("TV_SHOW");


    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!title.trim()) {
            setError("Title cannot be empty.");
            return;
        }

        try {
            const newTvShow = await createTvShow({ title, releaseDate: dateToISOString(releaseDate) });
            setTvShows((currentTvShows) => [...currentTvShows, newTvShow]);
            if (addToCalendarOnCreate) { await addToCalendar(newTvShow.id); await refreshCalendarStatus(); }
            setTitle("");
            setError("");
            setReleaseDate(new Date().toISOString().split("T")[0]);
            setAddToCalendarOnCreate(false);
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
    async function handleAddToCalendar(sourceId: number) {
        try {
            await addToCalendar(sourceId);
            await refreshCalendarStatus();
        } catch (error) {
            setError("Could not add TV show to calendar.");
        }
    }
    async function handleRemoveFromCalendar(sourceId: number) {
        try {
            await removeFromCalendar(sourceId);
            await refreshCalendarStatus();
        } catch (error) {
            setError("Could not remove TV show from calendar.");
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
                        setEditReleaseDate(isoToDateInputValue(tvShow.releaseDate));
                    }}>
                         {editingTvShowId === tvShow.id ? "Cancel" : "Edit"}
                    </button>
                    {editingTvShowId === tvShow.id && (
                        <form onSubmit={(event) => {event.preventDefault(); handleUpdate(tvShow.id, { title:editTitle, releaseDate:  dateToISOString(editReleaseDate) }); setEditingTvShowId(null);}} >
                            <input name="title"  value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                            <input name="releaseDate" type="date" min={new Date().toISOString().split("T")[0]} value={editReleaseDate} onChange={(e) => setEditReleaseDate(e.target.value)} />
                            {calendarSourceIds.has(tvShow.id) ? <><span className="calendar-status">On calendar</span><button type="button" onClick={() => handleRemoveFromCalendar(tvShow.id)}>Remove from Calendar</button></> : <button type="button" onClick={() => handleAddToCalendar(tvShow.id)}>Add to Calendar</button>}
                            <button type="submit">Update TV Show</button>
                        </form>
                    )}
                    <p>
                        {tvShow.title}
                    </p>     
                    <p>
                        {isoToDisplayDate(tvShow.releaseDate)}
                    </p>
                    
                    <button type="button" className="danger-button" onClick={() => setPendingDeleteId(tvShow.id)}>
                        Delete TV Show
                    </button>
                </div>
            ))}
            <form onSubmit={handleSubmit}>
                <input name="title" placeholder="Enter a TV show" value={title} onChange={(e) => setTitle(e.target.value)} />
                <input name="releaseDate" type="date" min={new Date().toISOString().split("T")[0]} value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
                <label className="calendar-checkbox"><input type="checkbox" checked={addToCalendarOnCreate} onChange={(e) => setAddToCalendarOnCreate(e.target.checked)} /> Add to calendar</label>
                <button type="submit">Create TV Show</button>
            </form>
            <Modal isOpen={pendingDeleteId !== null} title="Delete TV show?" confirmLabel="Delete TV show" destructive onCancel={() => setPendingDeleteId(null)} onConfirm={() => { if (pendingDeleteId !== null) { handleDelete(pendingDeleteId); setPendingDeleteId(null); } }}><p>This permanently removes the TV show.</p></Modal>
        </div>
       
    );
}
