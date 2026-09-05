import type{ Request, Response } from "express";
import { createAppointmentEventService, createAppointmentService, deleteAppointmentEventService, deleteAppointmentService, getAppointmentService, getAppointmentsService, updateAppointmentService } from "../services/appointments.service.js";

export const getAppointments = async (req: Request, res: Response) => {
    try {
        const appointments = await getAppointmentsService();
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: "Error fetching appointments", error });
    }       
};
export const getAppointment = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const appointment = await getAppointmentService(id);
        res.status(200).json(appointment);
    } catch (error) { 
        res.status(500).json({ message: "Error fetching appointment", error });
    }
};
export const createAppointment = async (req: Request, res: Response) => {
    try {
        const { title, startTime, endTime } = req.body;
        const appointment = await createAppointmentService(title, startTime, endTime);
        res.status(201).json(appointment); 
    } catch (error) {
        res.status(500).json({ message: "Error creating appointment", error });
    }
};
export const updateAppointment = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { title, startTime, endTime } = req.body;
        const appointment = await updateAppointmentService(id, title, startTime, endTime);
        res.status(200).json(appointment);
    } catch (error) {
        res.status(500).json({ message: "Error updating appointment", error });
    }
};
export const deleteAppointment = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const appointment = await deleteAppointmentService(id);
        res.status(200).json(appointment);
    } catch (error) {
        res.status(500).json({ message: "Error deleting appointment", error });
    }
};
export const createAppointmentEvent = async (req: Request, res: Response) => {
    try {
        const sourceId = Number(req.params.id);
        const { type } = req.body;
        const event = await createAppointmentEventService(sourceId, type);
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: "Error creating event", error });
    }
};
export const deleteAppointmentEvent = async (req: Request, res: Response) => {
    try {
        const eventId = Number(req.params.eventId);
        const event = await deleteAppointmentEventService(eventId);
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: "Error deleting event", error });
    }
};