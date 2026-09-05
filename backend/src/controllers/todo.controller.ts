import type{ Request, Response } from "express";
import { getTodosService,getTodoService,createTodoService,updateTodoService, deleteTodoService, createTodoEventService, deleteTodoEventService } from "../services/todo.service.js";


export const getTodos = async (req: Request, res: Response) => {
    try {
        const todos = await getTodosService();
        res.status(200).json(todos);
    } catch (error) {
        res.status(500).json({ message: "Error fetching todos", error });
    }       
};
export const getTodo = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const todo = await getTodoService(id);
        res.status(200).json(todo);
    } catch (error) { 
        res.status(500).json({ message: "Error fetching todo", error });
    }
};
export const createTodo = async (req: Request, res: Response) => {
    try {
        const { title } = req.body;
        const todo = await createTodoService(title);
        res.status(201).json(todo);
    } catch (error) {
        res.status(500).json({ message: "Error creating todo", error });
    }
};
export const updateTodo = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { title, completed } = req.body;
        const todo = await updateTodoService(id, title, completed);
        res.status(200).json(todo);
    } catch (error) {
        res.status(500).json({ message: "Error updating todo", error });
    }
};
export const deleteTodo = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const todo = await deleteTodoService(id);
        res.status(200).json(todo);
    } catch (error) {
        res.status(500).json({ message: "Error deleting todo", error });
    }
};
export const createTodoEvent = async (req: Request, res: Response) => {
    try {
        const sourceId = Number(req.params.id);
        const { type } = req.body;
        const event = await createTodoEventService(sourceId, type);
        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: "Error creating event", error });
    }
};
export const deleteTodoEvent = async (req: Request, res: Response) => {
    try {
        const eventId = Number(req.params.eventId);
        const event = await deleteTodoEventService(eventId);
        res.status(200).json(event);
    } catch (error) {
        res.status(500).json({ message: "Error deleting event", error });
    }
};