export default function TodoCard({ event }: { event: any }) {
    return (
        <div className="todo-card">
            <h3>{event.title}</h3>
            <p>{event.date}</p>
        </div>
    );
}