export interface Movies {
    id: number;
    title: string;
    releaseDate: string
}
export interface CreateMovies{
    title: string;
    releaseDate: string;
}
export interface UpdateMovies{
    title?: string;
    releaseDate?: string;
}
