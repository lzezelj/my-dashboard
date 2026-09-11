import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { TvShows, UpdateTvShows } from "../types/tv_shows";
import { createTvShow, getTvShows, updateTvShow, deleteTvShow, addToCalendar, removeFromCalendar } from "../services/tv_shows.api.ts";
import { dateToISOString, isoToDateInputValue, isoToDisplayDate } from "../utils/dateUtils";
import Modal from "../components/Modal";
import useCalendarStatus from "../hooks/useCalendarStatus";
import type { EditOutletContext } from "./Edit";

export default function TvShows() {
    const { showToast } = useOutletContext<EditOutletContext>();
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
    const [selectedTvShowIds, setSelectedTvShowIds] = useState<Set<number>>(new Set());
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const [episodeCount, setEpisodeCount] = useState("1");
    const [firstDayEpisodeCount, setFirstDayEpisodeCount] = useState("1");
    const { calendarSourceIds, refreshCalendarStatus } = useCalendarStatus("TV_SHOW");


    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!title.trim()) {
            setError("Title cannot be empty.");
            return;
        }

        try {
            const totalEpisodes = Number(episodeCount);
            const firstDayEpisodes = Number(firstDayEpisodeCount);
            if (!Number.isInteger(totalEpisodes) || totalEpisodes < 1 || !Number.isInteger(firstDayEpisodes) || firstDayEpisodes < 1 || firstDayEpisodes > totalEpisodes) {
                setError("Episode counts must be whole numbers, and the first-day count cannot exceed the total.");
                return;
            }

            const newTvShows: TvShows[] = [];
            for (let index = 0; index < totalEpisodes; index++) {
                const episodeDate = new Date(`${releaseDate}T12:00:00`);
                if (index >= firstDayEpisodes) episodeDate.setDate(episodeDate.getDate() + (index - firstDayEpisodes + 1) * 7);
                const episodeTitle = totalEpisodes === 1 ? title : `${title} Episode ${index + 1}`;
                newTvShows.push(await createTvShow({ title: episodeTitle, releaseDate: episodeDate.toISOString() }));
            }
            setTvShows((currentTvShows) => [...currentTvShows, ...newTvShows]);
            if (addToCalendarOnCreate) {
                for (const tvShow of newTvShows) {
                    await addToCalendar(tvShow.id);
                }
                await refreshCalendarStatus();
            }
            setTitle("");
            setError("");
            setReleaseDate(new Date().toISOString().split("T")[0]);
            setAddToCalendarOnCreate(false);
            setEpisodeCount("1");
            setFirstDayEpisodeCount("1");
            showToast(totalEpisodes === 1 ? "TV show created successfully." : `${totalEpisodes} TV episodes created successfully.`);
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
        await handleRemoveFromCalendar(id);
        try {
            await deleteTvShow(id);
            setTvShows((currentTvShows) => currentTvShows.filter((tvShow) => tvShow.id !== id));
        } catch (error) {
            setError("Could not delete TV show.");
        }
    }
    function toggleTvShowSelection(id: number) {
        setSelectedTvShowIds((currentIds) => {
            const nextIds = new Set(currentIds);
            if (nextIds.has(id)) nextIds.delete(id);
            else nextIds.add(id);
            return nextIds;
        });
    }
    async function handleDeleteSelected() {
        const idsToDelete = [...selectedTvShowIds];
        try {
            for (const id of idsToDelete) {
                await handleRemoveFromCalendar(id);
                await deleteTvShow(id);
            }
            setTvShows((currentTvShows) => currentTvShows.filter((tvShow) => !selectedTvShowIds.has(tvShow.id)));
            setSelectedTvShowIds(new Set());
        } catch (error) {
            setError("Could not delete the selected TV shows.");
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
                    <label className="select-event"><input type="checkbox" checked={selectedTvShowIds.has(tvShow.id)} onChange={() => toggleTvShowSelection(tvShow.id)} /> Select for deletion</label>
                    <button type="button" onClick={() => {
                        setEditingTvShowId(editingTvShowId === tvShow.id ? null : tvShow.id);
                        setEditTitle(tvShow.title);
                        setEditReleaseDate(isoToDateInputValue(tvShow.releaseDate));
                    }}>
                        {editingTvShowId === tvShow.id ? "Cancel" : "Edit"}
                    </button>
                    {editingTvShowId === tvShow.id && (
                        <form onSubmit={(event) => { event.preventDefault(); handleUpdate(tvShow.id, { title: editTitle, releaseDate: dateToISOString(editReleaseDate) }); setEditingTvShowId(null); }} >
                            <label className="form-field">Title<input name="title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} /></label>
                            <label className="form-field">Release date<input name="releaseDate" type="date" value={editReleaseDate} onChange={(e) => setEditReleaseDate(e.target.value)} /></label>
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
            {selectedTvShowIds.size > 0 && <button type="button" className="danger-button bulk-delete-button" onClick={() => setIsBulkDeleteOpen(true)}>Delete {selectedTvShowIds.size} selected</button>}
            <form onSubmit={handleSubmit}>
                <label className="form-field">Show title<input name="title" placeholder="Enter a TV show" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
                <label className="form-field">First release date<input name="releaseDate" type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} /></label>
                <label className="form-field">Total episodes<input name="episodeCount" type="number" min="1" value={episodeCount} onChange={(e) => setEpisodeCount(e.target.value)} /></label>
                <label className="form-field">Episodes released on the first day<input name="firstDayEpisodeCount" type="number" min="1" value={firstDayEpisodeCount} onChange={(e) => setFirstDayEpisodeCount(e.target.value)} /></label>
                <label className="calendar-checkbox"><input type="checkbox" checked={addToCalendarOnCreate} onChange={(e) => setAddToCalendarOnCreate(e.target.checked)} /> Add to calendar</label>
                <button type="submit">Create TV Show</button>
            </form>
            <Modal isOpen={pendingDeleteId !== null} title="Delete TV show?" confirmLabel="Delete TV show" destructive onCancel={() => setPendingDeleteId(null)} onConfirm={() => { if (pendingDeleteId !== null) { handleDelete(pendingDeleteId); setPendingDeleteId(null); } }}><p>This permanently removes the TV show.</p></Modal>
            <Modal isOpen={isBulkDeleteOpen} title="Permanently delete selected TV shows?" confirmLabel="Delete selected" destructive onCancel={() => setIsBulkDeleteOpen(false)} onConfirm={() => { handleDeleteSelected(); setIsBulkDeleteOpen(false); }}><p>This permanently removes {selectedTvShowIds.size} TV show entries. This action cannot be undone.</p></Modal>
        </div>

    );
}
