import CardSwitch from "../eventCards/CardSwitch";

export default function EventWindow({ event }: { event: any[] }) {
    return (
        <section className="event-window event-window-large">
            <h2>All events</h2>
            <div className="event-window-content">
                {event.map((event) => (
                    <div>
                        <p style={{ fontWeight: "bold" }}>{event.eventType}</p>
                        <CardSwitch key={event.calendarEventId} event={event} />
                    </div>
                ))}

            </div>
        </section>
    );
}
