import type { Request, Response } from "express";
import { getEventsService, getCalendarEventService, getSourceEventService } from "../services/events.service.js";
import type { EventType } from "../generated/prisma/client.js";


export const getCalendarEvents = async (req: Request, res: Response) => {
    try {
        const events = await getEventsService();
        console.log("events", events);
        const calendarEvents = await Promise.all(events.map((event) => {
            return getCalendarEventService({ type: event.type, sourceId: event.sourceId, id: event.id });
        }));
        calendarEvents.sort((a, b) =>
            new Date(a.date!).getTime() - new Date(b.date!).getTime()
        );
        res.status(200).json(calendarEvents);
    } catch (error) {
        res.status(500).json({ message: "Error fetching events", error });
    }
};
export const getCalendarEvent = async (req: Request, res: Response) => {
    try {
        const { type, sourceId, id } = req.params;
        const event = await getCalendarEventService({ type: type as EventType, sourceId: Number(sourceId), id: Number(id) })
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: "Error fetching event", error });
    }
};
export const getSourceEvents = async (req: Request, res: Response) => {
    try {
        const events = await getEventsService();
        const sourceEvents = await Promise.all(events.map((event) => {
            return getSourceEventService({ type: event.type as EventType, sourceId: Number(event.sourceId) }).then(sourceEvent => ({ ...sourceEvent, calendarEventId: event.id, eventType: event.type }));
        }))
        res.status(200).json(sourceEvents);
    } catch (error) {
        res.status(500).json({ message: "Error fetching source event", error });
    }
};