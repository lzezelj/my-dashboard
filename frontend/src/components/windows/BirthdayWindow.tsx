import BirthdayCard from "../eventCards/BirthdayCard";

export default function BirthdayWindow({ event }: { event: any[] }) {
    return (
        <section className="event-window">
            <h2>Birthdays</h2>
            <div className="event-window-content">
                {event.map((event) => (
                    <BirthdayCard key={event.calendarEventId} event={event} />
                ))}
            </div>
        </section>
    );
}
