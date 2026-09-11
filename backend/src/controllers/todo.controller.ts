import type { Request, Response } from "express";
import { getTodosService, getTodoService, createTodoService, updateTodoService, deleteTodoService, createTodoEventService, deleteTodoEventService } from "../services/todo.service.js";


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
        const { title, deadline } = req.body;
        const todo = await createTodoService(title, deadline);
        res.status(201).json(todo);
    } catch (error) {
        res.status(500).json({ message: "Error creating todo", error });
    }
};
export const updateTodo = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { title, completed, deadline } = req.body;
        const todo = await updateTodoService(id, title, completed, deadline);
        res.status(200).json(todo);
    } catch (error) {
        res.status(500).json({ message: "Error updating todo", error });
    }
};
export const deleteTodo = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const todo = await deleteTodoService(id);
        res.status(204).json(todo);
    } catch (error) {
        res.status(500).json({ message: "Error deleting todo", error });
    }
};
export const createTodoEvent = async (req: Request, res: Response) => {
    try {
        const sourceId = Number(req.params.id);
        const event = await createTodoEventService(sourceId);
        res.status(201).json(event);
    } catch (error) {
        res.status(409).json({ message: "Error creating event", error });
    }
};
export const deleteTodoEvent = async (req: Request, res: Response) => {
    try {
        const sourceId = Number(req.params.id);
        const event = await deleteTodoEventService(sourceId);
        res.status(204).json(event);
    } catch (error) {
        res.status(500).json({ message: "Error deleting event", error });
    }
};