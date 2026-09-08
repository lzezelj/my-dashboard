import { useEffect, useState } from "react";
import type {CalendarEvent, SourceEvents} from "../types/events";
import { getCalendarEvents, getSourceEvents } from "../services/home.api";
import CardSwitch from "./eventCards/CardSwitch";

export default function Calendar() {
    interface MonthDay{
        days: number;
        month: number;
    }
    const createMonthDays = (year: number, month: number): MonthDay[] => {
        const monthDays: MonthDay[] = Array.from(
            { length: numberOfDays(year)[month].days },
            (_, i) => ({
                days: i + 1,
                month
            })
        );

        const weekday = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const emptyDays = weekday === 0 ? 6 : weekday - 1;
        for (let i = 0; i < emptyDays; i++) {
            monthDays.unshift({
                days: 0,
                month: month
            });
        }

        return monthDays;
    };
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const leapYear = (year: number) => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    const numberOfDays = (year:number): MonthDay[] => [
        { days: 31, month: 0 },
        { days: leapYear(year) ? 29 : 28, month: 1 }, // February
        { days: 31, month: 2 },
        { days: 30, month: 3 },
        { days: 31, month: 4 },
        { days: 30, month: 5 },
        { days: 31, month: 6 },
        { days: 31, month: 7 },
        { days: 30, month: 8 },
        { days: 31, month: 9 },
        { days: 30, month: 10 },
        { days: 31, month: 11 }
    ]
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date| null>(null);
    const [sourceEvents, setSourceEvents] = useState<SourceEvents[]>([]);
    const monthDays = createMonthDays(currentYear, currentMonth);
    const eventsByDate=new Map<string,number>();
    const dayCalendarEvents = calendarEvents.filter((event) => {
        const eventDate = new Date(event.date);
        return (
            eventDate.getFullYear() === currentYear &&
            eventDate.getMonth() === currentMonth &&
            eventDate.getDate() === selectedDate?.getDate()
        );
    });
    const daySourceEvents = sourceEvents.filter((event) => {
        return dayCalendarEvents.some(calendarEvent => calendarEvent.id === event.calendarEventId);
    });
    calendarEvents.forEach(event => {
        const eventDate = new Date(event.date);
        if(eventDate.getFullYear() === currentYear && eventDate.getMonth() === currentMonth) {
            const dateKey = `${eventDate.getFullYear()}-${eventDate.getMonth()+1}-${eventDate.getDate()}`;
            eventsByDate.set(dateKey, (eventsByDate.get(dateKey) || 0)+1);
        }
    });
    useEffect(() => {
        async function loadCalendarEvents() {
            try {
                const data = await getCalendarEvents();
                setCalendarEvents(data);
            } catch (error) {
                console.error(error);
            }
        }
        async function loadSourceEvents(){
            try {
                const data = await getSourceEvents();
                setSourceEvents(data);
            } catch (error) {
                console.error(error);
            }
        }
        loadCalendarEvents();
        loadSourceEvents();
    }, 
    []);
    return (
        <div className="calendar">
            <h3>WIP Calendar</h3>
            <input type="month" value={`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`} onChange={(e) => {
                const [year, month] = e.target.value.split('-').map(Number);
                setCurrentYear(year);
                setCurrentMonth(month - 1);
            }} />
            <div className="calendar-grid">
                {days.map((day) => (
                    <span key={day}>{day}</span>
                ))}
                {monthDays.map((monthDay, index) => {
                    if(monthDay.days===0){
                        return (
                            <span key={index}></span>
                        );
                    }
                
                return (
                    <button key={index} className="calendar-day" onClick={() => setSelectedDate(new Date(currentYear, currentMonth, monthDay.days))}>
                        <span>{monthDay.days}</span>
                        <span className="event-count">{eventsByDate.get(`${currentYear}-${currentMonth+1}-${monthDay.days}`)}</span>

                    </button>
                );
                })}
            </div>
            {selectedDate && (
                <div className="selected-date-events">
                    <h4>Events for {selectedDate.toDateString()}</h4>
                    <ul>
                        {daySourceEvents.map((event) => (
                            <CardSwitch
                                key={event.calendarEventId}
                                event={event}
                            />
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}