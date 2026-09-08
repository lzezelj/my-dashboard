import type { Todo, CreateTodo, UpdateTodo } from "../types/todos";


export async function getTodos(): Promise<Todo[]> {
    const response = await fetch("http://localhost:3000/api/todos");
    if (!response.ok) {
        throw new Error("Failed to fetch todos");
    }

    return response.json();
}
export async function createTodo(todo: CreateTodo): Promise<Todo> {
    const response = await fetch("http://localhost:3000/api/todos", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(todo),
    });
    if (!response.ok) {
        throw new Error("Failed to create todo");
    }
    return response.json();
}
export async function updateTodo(id: number, todo: UpdateTodo): Promise<Todo> {
    const response = await fetch(`http://localhost:3000/api/todos/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(todo),
    });
    if (!response.ok) {
        throw new Error("Failed to update todo");
    }
    return response.json();
}
export async function deleteTodo(id: number): Promise<void> {
    const response = await fetch(`http://localhost:3000/api/todos/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Failed to delete todo");
    }
    return;
}
export async function addToCalendar(sourceId:number): Promise<void> {
    const response = await fetch(`http://localhost:3000/api/todos/${sourceId}/event`, {
        method: "POST",
    });
    if (!response.ok) {
        throw new Error("Failed to add todo to calendar");
    }
    return;
}
export async function removeFromCalendar(sourceId:number): Promise<void> {
    const response = await fetch(`http://localhost:3000/api/todos/${sourceId}/event`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Failed to remove todo from calendar");
    }
    return;
}