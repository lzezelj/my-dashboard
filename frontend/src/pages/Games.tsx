import { useEffect, useState } from "react";
import type { Games, UpdateGames } from "../types/games";
import { createGame, deleteGame, getGames, updateGame } from "../services/games.api.ts";

export default function Games() {
    const [games, setGames] = useState<Games[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [editTitle, setEditTitle] = useState("");
    const [editRelease, setEditRelease] = useState(new Date().toISOString().split("T")[0]);
    const [editingGameId, setEditingGameId] = useState<number | null>(null);
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
            const newGame = await createGame({ title, released: new Date(released) });
            setGames((currentGames) => [...currentGames, newGame]);
            setTitle("");
            setReleased(new Date().toISOString().split("T")[0]);
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
            setError("Could not update movie.");
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
                        setEditRelease(game.released.toISOString().split("T")[0]);
                    }}>
                         {editingGameId === game.id ? "Cancel" : "Edit"}
                    </button>
                    {editingGameId === game.id && (
                        <form onSubmit={(event) => {event.preventDefault(); handleUpdate(game.id, { title:editTitle, released: new Date(editRelease) }); setEditingGameId(null);}} >
                            <input name="title"  value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                            <input name="released" type="date" value={editRelease} onChange={(e) => setEditRelease(e.target.value)} />
                            <button type="submit">Update Game</button>
                        </form>
                    )}
                    <p>
                        {game.title}
                    </p>     
                    <p>
                        {convertedDate(game.released)}
                    </p>
                    
                    <button type="button" onClick={() => handleDelete(game.id)}>
                        Delete Game
                    </button>
                </div>
            ))}
            <form onSubmit={handleSubmit}>
                <input name="title" placeholder="Enter a game" value={title} onChange={(e) => setTitle(e.target.value)} />
                <input name="released" type="date" value={released} onChange={(e) => setReleased(e.target.value)} />
                <button type="submit">Create Game</button>
            </form>
        </div>
       
    );
}