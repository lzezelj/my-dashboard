import type { Request, Response } from "express";
import { createBirthdayEventService, createBirthdayService, deleteBirthdayEventService, deleteBirthdayService, getBirthdayService, getBirthdaysService, updateBirthdayService } from "../services/birthday.services.js";

export const getBirthdays = async (req: Request, res: Response) => {
    try {
        const birthdays = await getBirthdaysService();
        res.status(200).json(birthdays);
    } catch (error) {
        res.status(500).json({ message: "Error fetching birthdays", error });
    }
};
export const getBirthday = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const birthday = await getBirthdayService(id);
        res.status(200).json(birthday);
    } catch (error) {
        res.status(500).json({ message: "Error fetching birthday", error });
    }
};
export const createBirthday = async (req: Request, res: Response) => {
    try {
        const { name, date } = req.body;
        const birthday = await createBirthdayService(name, date);
        res.status(201).json(birthday);
    } catch (error) {
        res.status(500).json({ message: "Error creating birthday", error });
    }
};
export const updateBirthday = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { name, date } = req.body;
        const birthday = await updateBirthdayService(id, name, date);
        res.status(200).json(birthday);
    } catch (error) {
        res.status(500).json({ message: "Error updating birthday", error });
    }
};
export const deleteBirthday = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const birthday = await deleteBirthdayService(id);
        res.status(204).json(birthday);
    } catch (error) {
        res.status(500).json({ message: "Error deleting birthday", error });
    }
};
export const createBirthdayEvent = async (req: Request, res: Response) => {
    try {
        const sourceId = Number(req.params.id);
        const event = await createBirthdayEventService(sourceId);
        res.status(201).json(event);
    } catch (error) {
        res.status(409).json({ message: "Error creating event", error });
    }
};
export const deleteBirthdayEvent = async (req: Request, res: Response) => {
    try {
        const sourceId = Number(req.params.id);
        const event = await deleteBirthdayEventService(sourceId);
        res.status(204).json(event);
    } catch (error) {
        res.status(500).json({ message: "Error deleting event", error });
    }
};