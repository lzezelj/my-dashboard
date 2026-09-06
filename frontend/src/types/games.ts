export interface Games {
    id: number;
    title: string;
    releaseDate: string
}
export interface CreateGames{
    title: string;
    releaseDate: string;
}
export interface UpdateGames{
    title?: string;
    releaseDate?: string;
}
