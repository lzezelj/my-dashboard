import type{ Request, Response } from "express";
import { getTodosService,getTodoService,createTodoService,updateTodoService, deleteTodoService } from "../services/todo.service.js";
import { prisma } from "../lib/prisma.js";

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
        const { title, description } = req.body;
        const todo = await createTodoService(title, description);
        res.status(201).json(todo);
    } catch (error) {
        res.status(500).json({ message: "Error creating todo", error });
    }
};
export const updateTodo = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const { title, description } = req.body;
        const todo = await updateTodoService(id, title, description);
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
