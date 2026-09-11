import type { Movies } from "./movies";
import type { TvShows } from "./tv_shows";
import type { Games } from "./games";
import type { Birthdays } from "./birthdays";
import type { Appointment } from "./appointments";
import type { Todo } from "./todos";
export type SourceEvents =
    | (Movies & { calendarEventId: number; calendarDate: string; eventType: "MOVIE" })
    | (TvShows & { calendarEventId: number; calendarDate: string; eventType: "TV_SHOW" })
    | (Games & { calendarEventId: number; calendarDate: string; eventType: "GAME" })
    | (Birthdays & { calendarEventId: number; calendarDate: string; eventType: "BIRTHDAY" })
    | (Appointment & { calendarEventId: number; calendarDate: string; eventType: "APPOINTMENT" })
    | (Todo & { calendarEventId: number; calendarDate: string; eventType: "TODO" })
export interface CalendarEvent{
    id: number;
    title: string;
    date:string;
    sourceId:number;
}
