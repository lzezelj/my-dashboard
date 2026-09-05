import type{ Request, Response } from "express";
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
        const { title, released } = req.body;
        const movie = await createMovieService(title, released);
        res.status(201).json(movie);
    } catch (error) {
        res.status(500).json({ message: "Error creating movie", error });
    }
};
export const updateMovie = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { title, released } = req.body;
        const movie = await updateMovieService(id, title, released);
        res.status(200).json(movie);
    } catch (error) {
        res.status(500).json({ message: "Error updating movie", error });
    }
};
export const deleteMovie = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const movie = await deleteMovieService(id);
        res.status(200).json(movie);
    } catch (error) {
        res.status(500).json({ message: "Error deleting movie", error });
    }
};
export const createMovieEvent = async (req: Request, res: Response) => {
    try {
        const sourceId = Number(req.params.id);
        const { type } = req.body;
        const event = await createMovieEventService(sourceId, type);
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: "Error creating event", error });
    }
};
export const deleteMovieEvent = async (req: Request, res: Response) => {
    try {
        const eventId = Number(req.params.eventId);
        const event = await deleteMovieEventService(eventId);
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: "Error deleting event", error });
    }
};