export interface Todo {
    id: number;
    title: string;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
    deadline: string;
}
export interface CreateTodo{
    title: string;
    deadline: string;
}
export interface UpdateTodo{
    title?: string;
    completed?: boolean;
    deadline?: string;
}
