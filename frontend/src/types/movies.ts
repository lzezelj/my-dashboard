export interface Movies {
    id: number;
    title: string;
    released: Date
}
export interface CreateMovies{
    title: string;
    released: Date;
}
export interface UpdateMovies{
    title?: string;
    released?: Date;
}
