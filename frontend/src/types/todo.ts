export interface Todo {
    id: number;
    title: string;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface CreateTodo{
    title: string;
}
export interface UpdateTodo{
    title?: string;
    completed?: boolean;
}
