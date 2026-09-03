import {Router} from "express";
import { getTodos,getTodo, createTodo, updateTodo, deleteTodo } from "../controllers/todo.controller.js";

const router = Router();

router.get("/", getTodos);
router.get("/:id",getTodo);
router.post("/", createTodo);
router.patch("/:id", updateTodo);
router.delete("/:id", deleteTodo);

export default router;