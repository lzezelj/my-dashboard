export type EventTimePeriod = "today" | "week" | "month" | "later";

export function getEventTimePeriod(dateValue: string): EventTimePeriod {
    const eventDate = new Date(dateValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setDate(today.getDate() + 1);
    if (eventDate >= today && eventDate < endOfToday) return "today";

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    if (eventDate >= startOfWeek && eventDate < endOfWeek) return "week";

    if (eventDate.getFullYear() === today.getFullYear() && eventDate.getMonth() === today.getMonth()) return "month";

    return "later";
}
