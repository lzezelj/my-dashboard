import { useEffect, useState } from "react";
import type { Todo, UpdateTodo } from "../types/todos.ts";
import { addToCalendar, createTodo, deleteTodo, getTodos, removeFromCalendar, updateTodo } from "../services/todos.api.ts";
import {dateToISOString, isoToDateInputValue, isoToDisplayDate} from "../utils/dateUtils";
import Modal from "../components/Modal";
import useCalendarStatus from "../hooks/useCalendarStatus";

export default function Todos() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [deadline, setDeadline] = useState(new Date().toISOString().split("T")[0]);
    const [editTitle, setEditTitle] = useState("");
    const [editDeadline, setEditDeadline] = useState("");
    const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
    const [addToCalendarOnCreate, setAddToCalendarOnCreate] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
    const { calendarSourceIds, refreshCalendarStatus } = useCalendarStatus("TODO");
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!title.trim()) {
            setError("Title cannot be empty.");
            return;
        }

        try {
            const newTodo = await createTodo({ title, deadline:dateToISOString(deadline) });
            setTodos((currentTodos) => [...currentTodos, newTodo]);
            if (addToCalendarOnCreate) { await addToCalendar(newTodo.id); await refreshCalendarStatus(); }
            setTitle("");
            setDeadline("");
            setAddToCalendarOnCreate(false);
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
    async function handleAddToCalendar(sourceId: number) {
        try {
            await addToCalendar(sourceId);
            await refreshCalendarStatus();
        } catch (error) {
            setError("Could not add todo to calendar.");
        }
    }
    async function handleRemoveFromCalendar(sourceId: number) {
        try {
            await removeFromCalendar(sourceId);
            await refreshCalendarStatus();
        } catch (error) {
            setError("Could not remove todo from calendar.");
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
                        setEditDeadline(isoToDateInputValue(todo.deadline));
                    }}>
                         {editingTodoId === todo.id ? "Cancel" : "Edit"}
                    </button>
                    {editingTodoId === todo.id && (
                        <form onSubmit={(event) => {event.preventDefault(); handleUpdate(todo.id, { title:editTitle, deadline: dateToISOString(editDeadline) }); setEditingTodoId(null);}} >
                            <input name="title"  value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                            <input name="deadline" type="date" min={new Date().toISOString().split("T")[0]} value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />
                            {calendarSourceIds.has(todo.id) ? <><span className="calendar-status">On calendar</span><button type="button" onClick={() => handleRemoveFromCalendar(todo.id)}>Remove from Calendar</button></> : <button type="button" onClick={() => handleAddToCalendar(todo.id)}>Add to Calendar</button>}
                            <button type="submit">Update Todo</button>
                        </form>
                    )}
                        <p>{todo.title}</p>
                    <p>
                        {isoToDisplayDate(todo.deadline)}
                    </p>
                                         
                    <p>
                        {todo.completed ? "Completed" : "Not completed"}
                    </p>
                    <form>
                        <button type="button" onClick={() => handleUpdate(todo.id, { completed: !todo.completed })}>
                            {todo.completed ? "Mark as not completed" : "Mark as completed"}
                        </button>
                    </form>
                    <button type="button" className="danger-button" onClick={() => setPendingDeleteId(todo.id)}>
                        Delete Todo
                    </button>
                </div>
            ))}
            <form onSubmit={handleSubmit}>
                <input name="title" placeholder="Enter a to do" value={title} onChange={(e) => setTitle(e.target.value)} />
                <input name="deadline" type="date" min={new Date().toISOString().split("T")[0]} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                <label className="calendar-checkbox"><input type="checkbox" checked={addToCalendarOnCreate} onChange={(e) => setAddToCalendarOnCreate(e.target.checked)} /> Add to calendar</label>
                <button type="submit">Create Todo</button>
            </form>
            <Modal isOpen={pendingDeleteId !== null} title="Delete todo?" confirmLabel="Delete todo" destructive onCancel={() => setPendingDeleteId(null)} onConfirm={() => { if (pendingDeleteId !== null) { handleDelete(pendingDeleteId); setPendingDeleteId(null); } }}><p>This permanently removes the todo.</p></Modal>
        </div>
       
    );
}
