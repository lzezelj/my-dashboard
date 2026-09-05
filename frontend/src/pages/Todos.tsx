import { useEffect, useState } from "react";
import type { Todo, UpdateTodo } from "../types/todo";
import { createTodo, deleteTodo, getTodos, updateTodo } from "../services/todo.api.ts";

export default function Todos() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [editTitle, setEditTitle] = useState("");
    const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!title.trim()) {
            setError("Title cannot be empty.");
            return;
        }

        try {
            const newTodo = await createTodo({ title });
            setTodos((currentTodos) => [...currentTodos, newTodo]);
            setTitle("");
        } catch (error) {
            setError("Could not create todo.");
        }
    }
    async function handleUpdate(id: number, changes: UpdateTodo) {
        try {
            const updatedTodo = await updateTodo(id, changes);
            setTodos((currentTodos) =>
                currentTodos.map((todo) =>
                    todo.id === id ? updatedTodo : todo
                )
            );
        } catch (error) {
            setError("Could not update todo.");
        }
    }
    async function handleDelete(id: number) {
        try {
            await deleteTodo(id);
            setTodos((currentTodos) => currentTodos.filter((todo) => todo.id !== id));
        } catch (error) {
            setError("Could not delete todo.");
        }
    }


    useEffect(() => {
        async function loadTodos() {
            try {
                const data = await getTodos();
                setTodos(data);
            } catch (error) {
                setError("Could not load todos.");
            } finally {
                setLoading(false);
            }
        }

        loadTodos();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div>
            <h1>To dos</h1>

            {todos.map((todo) => (
                <div key={todo.id}>
                    <button type="button" onClick={() => {
                        setEditingTodoId(editingTodoId === todo.id ? null : todo.id);
                        setEditTitle(todo.title);
                    }}>
                         {editingTodoId === todo.id ? "Cancel" : "Edit"}
                    </button>
                    {editingTodoId === todo.id && (
                        <form onSubmit={(event) => {event.preventDefault(); handleUpdate(todo.id, { title:editTitle }); setEditingTodoId(null);}} >
                            <input name="title"  value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                            <button type="submit">Update Todo</button>
                        </form>
                    )}
                        <p>{todo.title}</p>
                                         
                    <p>
                        {todo.completed ? "Completed" : "Not completed"}
                    </p>
                    <form>
                        <button type="button" onClick={() => handleUpdate(todo.id, { completed: !todo.completed })}>
                            {todo.completed ? "Mark as not completed" : "Mark as completed"}
                        </button>
                    </form>
                    <button type="button" onClick={() => handleDelete(todo.id)}>
                        Delete Todo
                    </button>
                </div>
            ))}
            <form onSubmit={handleSubmit}>
                <input name="title" placeholder="Enter a to do" value={title} onChange={(e) => setTitle(e.target.value)} />
                <button type="submit">Create Todo</button>
            </form>
        </div>
       
    );
}