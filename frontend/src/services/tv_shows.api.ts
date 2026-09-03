import type { TvShows, CreateTvShows, UpdateTvShows } from "../types/tv_shows";


export async function getTvShows(): Promise<TvShows[]> {
    const response = await fetch("http://localhost:3000/api/tvShows");
    if (!response.ok) {
        throw new Error("Failed to fetch TV shows");
    }

    return response.json();
}
export async function createTvShow(tvShow: CreateTvShows): Promise<TvShows> {
    const response = await fetch("http://localhost:3000/api/tvShows", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(tvShow),
    });
    if (!response.ok) {
        throw new Error("Failed to create TV show");
    }
    return response.json();
}
export async function updateTvShow(id: number, tvShow: UpdateTvShows): Promise<TvShows> {
    const response = await fetch(`http://localhost:3000/api/tvShows/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(tvShow),
    });
    if (!response.ok) {
        throw new Error("Failed to update TV show");
    }
    return response.json();
}
export async function deleteTvShow(id: number): Promise<TvShows> {
    const response = await fetch(`http://localhost:3000/api/tvShows/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Failed to delete TV show");
    }
    return response.json();
}
