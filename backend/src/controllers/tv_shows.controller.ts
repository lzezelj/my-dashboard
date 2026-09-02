import type{ Request, Response } from "express";
import { deleteTvShowService, getTvShowsService,getTvShowService, updateTvShowService,createTvShowService} from "../services/tv_shows.services.js";

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
        const { title, released } = req.body;
        const tvShow = await createTvShowService(title, released);
        res.status(201).json(tvShow);
    } catch (error) {
        res.status(500).json({ message: "Error creating tv show", error });
    }
};
export const updateTvShow = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { title, released } = req.body;
        const tvShow = await updateTvShowService(id, title, released);
        res.status(200).json(tvShow );
    } catch (error) {
        res.status(500).json({ message: "Error updating tv show", error });
    }
};
export const deleteTvShow = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const tvShow = await deleteTvShowService(id);
        res.status(200).json(tvShow);
    } catch (error) {
        res.status(500).json({ message: "Error deleting tv show", error });
    }
};
