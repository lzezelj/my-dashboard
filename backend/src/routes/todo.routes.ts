import {Router} from "express";
import { getTodos,getTodo, createTodo, updateTodo, deleteTodo, deleteTodoEvent, createTodoEvent } from "../controllers/todo.controller.js";

const router = Router();

router.get("/", getTodos);
router.get("/:id",getTodo);
router.post("/", createTodo);
router.patch("/:id", updateTodo);
router.delete("/:id", deleteTodo);

router.post("/:id/event",createTodoEvent);
router.delete("/:id/event",deleteTodoEvent);

export default router;