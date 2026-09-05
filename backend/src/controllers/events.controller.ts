import type{ Request, Response } from "express";
import { getEventsService,getEventService } from "../services/events.service.js";


export const getEvents = async (req: Request, res: Response) => {
    try {
        const events = await getEventsService();
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: "Error fetching events", error });
    }       
};
export const getEvent = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const event = await getEventService(id);
        res.status(200).json(event);
    } catch (error) { 
        res.status(500).json({ message: "Error fetching event", error });
    }
};
