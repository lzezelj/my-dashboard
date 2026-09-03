export interface TvShows {
    id: number;
    title: string;
    released: Date
}
export interface CreateTvShows{
    title: string;
    released: Date;
}
export interface UpdateTvShows{
    title?: string;
    released?: Date;
}
