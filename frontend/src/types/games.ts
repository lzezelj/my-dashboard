export interface Games {
    id: number;
    title: string;
    released: Date
}
export interface CreateGames{
    title: string;
    released: Date;
}
export interface UpdateGames{
    title?: string;
    released?: Date;
}
