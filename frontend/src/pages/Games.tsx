import { useEffect, useState } from "react";
import type { Games, UpdateGames } from "../types/games";
import { addToCalendar, createGame, deleteGame, getGames, removeFromCalendar, updateGame } from "../services/games.api.ts";
import { dateToISOString, isoToDateInputValue, isoToDisplayDate } from "../utils/dateUtils";
import Modal from "../components/Modal";
import useCalendarStatus from "../hooks/useCalendarStatus";

export default function Games() {
    const [games, setGames] = useState<Games[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [editTitle, setEditTitle] = useState("");
    const [editReleaseDate, setEditReleaseDate] = useState(new Date().toISOString().split("T")[0]);
    const [editingGameId, setEditingGameId] = useState<number | null>(null);
    const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split("T")[0]);
    const [addToCalendarOnCreate, setAddToCalendarOnCreate] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
    const { calendarSourceIds, refreshCalendarStatus } = useCalendarStatus("GAME");

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!title.trim()) {
            setError("Title cannot be empty.");
            return;
        }

        try {
            const newGame = await createGame({ title, releaseDate: dateToISOString(releaseDate) });
            setGames((currentGames) => [...currentGames, newGame]);
            if (addToCalendarOnCreate) { await addToCalendar(newGame.id); await refreshCalendarStatus(); }
            setTitle("");
            setReleaseDate(new Date().toISOString().split("T")[0]);
            setAddToCalendarOnCreate(false);
        } catch (error) {
            setError("Could not create game.");
        }
    }
    async function handleUpdate(id: number, changes: UpdateGames) {
        try {
            const updatedGame = await updateGame(id, changes);
            setGames((currentGames) =>
                currentGames.map((game) =>
                    game.id === id ? updatedGame : game
                )
            );
        } catch (error) {
            setError("Could not update game.");
        }
    }
    async function handleDelete(id: number) {
        try {
            await deleteGame(id);
            setGames((currentGames) => currentGames.filter((game) => game.id !== id));
        } catch (error) {
            setError("Could not delete game.");
        }
    }
    async function handleAddToCalendar(sourceId: number) {
        try {
            await addToCalendar(sourceId);
            await refreshCalendarStatus();
        } catch (error) {
            setError("Could not add game to calendar.");
        }
    }
    async function handleRemoveFromCalendar(sourceId: number) {
        try {
            await removeFromCalendar(sourceId);
            await refreshCalendarStatus();
        } catch (error) {
            setError("Could not remove game from calendar.");
        }
    }


    useEffect(() => {
        async function loadGames() {
            try {
                const data = await getGames();
                setGames(data);
            } catch (error) {
                setError("Could not load games.");
            } finally {
                setLoading(false);
            }
        }

        loadGames();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div>
            <h1>Games</h1>

            {games.map((game) => (
                <div key={game.id}>
                    <button type="button" onClick={() => {
                        setEditingGameId(editingGameId === game.id ? null : game.id);
                        setEditTitle(game.title);
                        setEditReleaseDate(isoToDateInputValue(game.releaseDate));
                    }}>
                        {editingGameId === game.id ? "Cancel" : "Edit"}
                    </button>
                    {editingGameId === game.id && (
                        <form onSubmit={(event) => { event.preventDefault(); handleUpdate(game.id, { title: editTitle, releaseDate: dateToISOString(editReleaseDate) }); setEditingGameId(null); }} >
                            <input name="title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                            {calendarSourceIds.has(game.id) ? <><span className="calendar-status">On calendar</span><button type="button" onClick={() => handleRemoveFromCalendar(game.id)}>Remove from calendar</button></> : <button type="button" onClick={() => handleAddToCalendar(game.id)}>Add to calendar</button>}
                            <input name="releaseDate" min={new Date().toISOString().split("T")[0]} type="date" value={editReleaseDate} onChange={(e) => setEditReleaseDate(e.target.value)} />
                            <button type="submit">Update Game</button>
                        </form>
                    )}
                    <p>
                        {game.title}
                    </p>
                    <p>
                        {isoToDisplayDate(game.releaseDate)}
                    </p>

                    <button type="button" className="danger-button" onClick={() => setPendingDeleteId(game.id)}>
                        Delete Game
                    </button>
                </div>
            ))}
            <form onSubmit={handleSubmit}>
                <input name="title" placeholder="Enter a game" value={title} onChange={(e) => setTitle(e.target.value)} />
                <input name="releaseDate" min={new Date().toISOString().split("T")[0]} type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} />
                <label className="calendar-checkbox"><input type="checkbox" checked={addToCalendarOnCreate} onChange={(e) => setAddToCalendarOnCreate(e.target.checked)} /> Add to calendar</label>
                <button type="submit">Create Game</button>
            </form>
            <Modal isOpen={pendingDeleteId !== null} title="Delete game?" confirmLabel="Delete game" destructive onCancel={() => setPendingDeleteId(null)} onConfirm={() => { if (pendingDeleteId !== null) { handleDelete(pendingDeleteId); setPendingDeleteId(null); } }}><p>This permanently removes the game.</p></Modal>
        </div>

    );
}
