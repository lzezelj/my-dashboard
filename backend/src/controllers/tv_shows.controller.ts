import type { Request, Response } from "express";
import { deleteTvShowService, getTvShowsService, getTvShowService, updateTvShowService, createTvShowService, createTvShowEventService, deleteTvShowEventService } from "../services/tv_shows.services.js";

export const getTvShows = async (req: Request, res: Response) => {
    try {
        const tvShows = await getTvShowsService();
        res.status(200).json(tvShows);
    } catch (error) {
        res.status(500).json({ message: "Error fetching tv shows", error });
    }
};
export const getTvShow = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const tvShow = await getTvShowService(id);
        res.status(200).json(tvShow);
    } catch (error) {
        res.status(500).json({ message: "Error fetching tv show", error });
    }
};
export const createTvShow = async (req: Request, res: Response) => {
    try {
        const { title, releaseDate } = req.body;
        const tvShow = await createTvShowService(title, releaseDate);
        res.status(201).json(tvShow);
    } catch (error) {
        res.status(500).json({ message: "Error creating tv show", error });
    }
};
export const updateTvShow = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { title, releaseDate } = req.body;
        const tvShow = await updateTvShowService(id, title, new Date(releaseDate));
        res.status(200).json(tvShow);
    } catch (error) {
        res.status(500).json({ message: "Error updating tv show", error });
    }
};
export const deleteTvShow = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const tvShow = await deleteTvShowService(id);
        res.status(204).json(tvShow);
    } catch (error) {
        res.status(500).json({ message: "Error deleting tv show", error });
    }
};
export const createTvShowEvent = async (req: Request, res: Response) => {
    try {
        const sourceId = Number(req.params.id);
        const event = await createTvShowEventService(sourceId);
        res.status(201).json(event);
    } catch (error) {
        res.status(409).json({ message: "Error creating event", error });
    }
};
export const deleteTvShowEvent = async (req: Request, res: Response) => {
    try {
        const sourceId = Number(req.params.id);
        const event = await deleteTvShowEventService(sourceId);
        res.status(204).json(event);
    } catch (error) {
        res.status(500).json({ message: "Error deleting event", error });
    }
};