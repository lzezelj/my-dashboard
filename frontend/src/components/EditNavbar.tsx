import { Link } from "react-router-dom";
export default function EditNavbar() {
    return (
        <nav className="edit-navbar" aria-label="Edit categories">
            <Link to="/edit/movies">Movies</Link>
            <Link to="/edit/tv-shows">TV Shows</Link>
            <Link to="/edit/games">Games</Link>
            <Link to="/edit/birthdays">Birthdays</Link>
            <Link to="/edit/appointments">Appointments</Link>
            <Link to="/edit/todos">Todos</Link>
        </nav>
    );
}
