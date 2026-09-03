import type { Movies, CreateMovies, UpdateMovies } from "../types/movies";


export async function getMovies(): Promise<Movies[]> {
    const response = await fetch("http://localhost:3000/api/movies");
    if (!response.ok) {
        throw new Error("Failed to fetch movies");
    }

    return response.json();
}
export async function createMovie(movie: CreateMovies): Promise<Movies> {
    const response = await fetch("http://localhost:3000/api/movies", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(movie),
    });
    if (!response.ok) {
        throw new Error("Failed to create movie");
    }
    return response.json();
}
export async function updateMovie(id: number, movie: UpdateMovies): Promise<Movies> {
    const response = await fetch(`http://localhost:3000/api/movies/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(movie),
    });
    if (!response.ok) {
        throw new Error("Failed to update movie");
    }
    return response.json();
}
export async function deleteMovie(id: number): Promise<Movies> {
    const response = await fetch(`http://localhost:3000/api/movies/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Failed to delete movie");
    }
    return response.json();
}
