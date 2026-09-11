import type { Request, Response } from "express";
import { createMovieEventService, createMovieService, deleteMovieEventService, deleteMovieService, getMovieService, getMoviesService, updateMovieService } from "../services/movies.service.js";

export const getMovies = async (req: Request, res: Response) => {
    try {
        const movies = await getMoviesService();
        res.status(200).json(movies);
    } catch (error) {
        res.status(500).json({ message: "Error fetching movies", error });
    }
};
export const getMovie = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const movie = await getMovieService(id);
        res.status(200).json(movie);
    } catch (error) {
        res.status(500).json({ message: "Error fetching movie", error });
    }
};
export const createMovie = async (req: Request, res: Response) => {
    try {
        const { title, releaseDate } = req.body;
        const movie = await createMovieService(title, new Date(releaseDate));
        res.status(201).json(movie);
    } catch (error) {
        res.status(500).json({ message: "Error creating movie", error });
    }
};
export const updateMovie = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { title, releaseDate } = req.body;
        const movie = await updateMovieService(id, title, new Date(releaseDate));
        res.status(200).json(movie);
    } catch (error) {
        res.status(500).json({ message: "Error updating movie", error });
    }
};
export const deleteMovie = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const movie = await deleteMovieService(id);
        res.status(204).json(movie);
    } catch (error) {
        res.status(500).json({ message: "Error deleting movie", error });
    }
};
export const createMovieEvent = async (req: Request, res: Response) => {
    try {
        const sourceId = Number(req.params.id);
        const event = await createMovieEventService(sourceId);
        res.status(201).json(event);
    } catch (error) {
        res.status(409).json({ message: "Error creating event", error });
    }
};
export const deleteMovieEvent = async (req: Request, res: Response) => {
    try {
        const sourceId = Number(req.params.id);
        const event = await deleteMovieEventService(sourceId);
        res.status(204).json(event);
    } catch (error) {
        res.status(500).json({ message: "Error deleting event", error });
    }
};
