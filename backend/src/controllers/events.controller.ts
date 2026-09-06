import type{ Request, Response } from "express";
import { getEventsService,getCalendarEventService,getSourceEventService } from "../services/events.service.js";
import type { EventType } from "../generated/prisma/client.js";


export const getCalendarEvents = async (req: Request, res: Response) => {
    try {
        const events = await getEventsService();
        const calendarEvents = await Promise.all(events.map((event) => {
            return getCalendarEventService({ type: event.type, sourceId: event.sourceId });
        }));    
        res.status(200).json(calendarEvents);
    } catch (error) {
        res.status(500).json({ message: "Error fetching events", error });
    }       
};
export const getCalendarEvent = async (req: Request, res: Response) => {
    try {
        const { type, sourceId } = req.params;
        const event = await getCalendarEventService({ type: type as EventType, sourceId: Number(sourceId) });
        res.status(200).json(event);
    } catch (error) { 
        res.status(500).json({ message: "Error fetching event", error });
    }
};
export const getSourceEvent=async (req: Request, res: Response) => {
    try {
        const { type, sourceId } = req.params;
        const event = await getSourceEventService({ type: type as EventType, sourceId: Number(sourceId) });
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: "Error fetching source event", error });
    }
};