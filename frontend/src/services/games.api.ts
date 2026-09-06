import type { Games, CreateGames, UpdateGames } from "../types/games";


export async function getGames(): Promise<Games[]> {
    const response = await fetch("http://localhost:3000/api/games");
    if (!response.ok) {
        throw new Error("Failed to fetch games");
    }

    return response.json();
}
export async function createGame(game: CreateGames): Promise<Games> {
    const response = await fetch("http://localhost:3000/api/games", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(game),
    });
    if (!response.ok) {
        throw new Error("Failed to create game");
    }
    return response.json();
}
export async function updateGame(id: number, game: UpdateGames): Promise<Games> {
    const response = await fetch(`http://localhost:3000/api/games/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(game),
    });
    if (!response.ok) {
        throw new Error("Failed to update game");
    }
    return response.json();
}
export async function deleteGame(id: number): Promise<void> {
    const response = await fetch(`http://localhost:3000/api/games/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Failed to delete game");
    }
    return;
}
export async function addToCalendar(sourceId:number): Promise<void> {
    const response = await fetch(`http://localhost:3000/api/games/${sourceId}/event`, {
        method: "POST",
    });
    if (!response.ok) {
        throw new Error("Failed to add game to calendar");
    }
    return;
}
export async function removeFromCalendar(sourceId:number): Promise<void> {
    const response = await fetch(`http://localhost:3000/api/games/${sourceId}/event`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Failed to remove game from calendar");
    }
    return;
}