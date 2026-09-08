export default function AppointmentCard({ event }: { event: any }) {
    return (
        <div className="appointment-card">
            <h3>{event.title}</h3>
            <p>{event.date}</p>
        </div>
    );
}