import type{ Request, Response } from "express";
import { createGameEventService, createGameService, deleteGameEventService, deleteGameService, getGameService, getGamesService, updateGameService } from "../services/games.service.js";

export const getGames = async (req: Request, res: Response) => {
    try {
        const games = await getGamesService();
        res.status(200).json(games);
    } catch (error) {
        res.status(500).json({ message: "Error fetching games", error });
    }       
};
export const getGame = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const game = await getGameService(id);
        res.status(200).json(game);
    } catch (error) { 
        res.status(500).json({ message: "Error fetching game", error });
    }
};
export const createGame = async (req: Request, res: Response) => {
    try {
        const { title, releaseDate } = req.body;
        const game = await createGameService(title, new Date(releaseDate));
        res.status(201).json(game); 
    } catch (error) {
        res.status(500).json({ message: "Error creating game", error });
    }
};
export const updateGame = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { title, releaseDate } = req.body;
        const game = await updateGameService(id, title, new Date(releaseDate));
        res.status(200).json(game);
    } catch (error) {
        res.status(500).json({ message: "Error updating game", error });
    }
};
export const deleteGame = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const game = await deleteGameService(id);
        res.status(204).json(game);
    } catch (error) {
        res.status(500).json({ message: "Error deleting game", error });
    }
};
export const createGameEvent = async (req: Request, res: Response) => {
    try {
        const sourceId = Number(req.params.id);
        const event = await createGameEventService(sourceId);
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: "Error creating event", error });
    }
};
export const deleteGameEvent = async (req: Request, res: Response) => {
    try {
        const sourceId = Number(req.params.id);
        const event = await deleteGameEventService(sourceId);
        res.status(204).json(event);
    } catch (error) {
        res.status(500).json({ message: "Error deleting event", error });
    }
};