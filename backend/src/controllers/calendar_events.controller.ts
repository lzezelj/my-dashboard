import type{ Request, Response } from "express";
import { getEventsService,getEventService,createEventService,updateEventService,deleteEventService } from "../services/calendar_events.service.js";
import { prisma } from "../lib/prisma.js";

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
export const createEvent = async (req: Request, res: Response) => {
    try {
        const { title, description, startDate, endDate } = req.body;
        const event = await createEventService(title, description, startDate, endDate);
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: "Error creating event", error });
    }
};
export const updateEvent = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { title, description, startDate, endDate } = req.body;
        const event = await updateEventService(id, title, description, startDate, endDate);
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: "Error updating event", error });
    }
};
export const deleteEvent = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const event = await deleteEventService(id);
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: "Error deleting event", error });
    }
};
