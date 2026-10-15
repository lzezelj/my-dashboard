import { Link } from 'react-router-dom';
export default function EditNavbar() {
  return (
    <nav className="edit-navbar" aria-label="Edit categories">
      <Link to="/events/appointments">Appointments</Link>
      <Link to="/events/birthdays">Birthdays</Link>
      <Link to="/events/events">Events</Link>
      <Link to="/events/games">Games</Link>
      <Link to="/events/movies">Movies</Link>
      <Link to="/events/school">School</Link>
      <Link to="/events/todos">Todos</Link>
      <Link to="/events/travel">Travel</Link>
      <Link to="/events/tv-shows">TV Shows</Link>
      <Link to="/events/work">Work</Link>
    </nav>
  );
}
