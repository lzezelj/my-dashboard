import AppointmentCard from "../eventCards/AppointmentCard";

export default function AppointmentWindow({ event }: { event: any[] }) {
    return (
        <section className="event-window">
            <h2>Appointments</h2>
            <div className="event-window-content">
                {event.map((event) => (
                    <AppointmentCard key={event.calendarEventId} event={event} />
                ))}
            </div>
        </section>
    );
}
