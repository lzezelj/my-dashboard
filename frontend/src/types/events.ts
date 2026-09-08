import type { Movies } from "./movies";
import type { TvShows } from "./tv_shows";
import type { Games } from "./games";
import type { Birthdays } from "./birthdays";
import type { Appointment } from "./appointments";
import type { Todo } from "./todos";
export type SourceEvents =
    | (Movies & { calendarEventId: number; eventType: "MOVIE" })
    | (TvShows & { calendarEventId: number; eventType: "TV_SHOW" })
    | (Games & { calendarEventId: number; eventType: "GAME" })
    | (Birthdays & { calendarEventId: number; eventType: "BIRTHDAY" })
    | (Appointment & { calendarEventId: number; eventType: "APPOINTMENT" })
    | (Todo & { calendarEventId: number; eventType: "TODO" })
export interface CalendarEvent{
    id: number;
    title: string;
    date:string;
    sourceId:number;
}