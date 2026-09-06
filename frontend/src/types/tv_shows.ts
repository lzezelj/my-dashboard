export interface TvShows {
    id: number;
    title: string;
    releaseDate: string
}
export interface CreateTvShows{
    title: string;
    releaseDate: string;
}
export interface UpdateTvShows{
    title?: string;
    releaseDate?: string;
}
