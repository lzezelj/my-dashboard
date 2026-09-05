import {Link} from "react-router-dom";

export default function Navbar() { 
    return (
        <nav className="navbar">
            <Link to="/">Home </Link>
            <Link to="/todos">Todos </Link>
            <Link to="/movies">Movies </Link>
            <Link to="/events">Events </Link>
            <Link to="/birthdays">Birthdays </Link>
            <Link to="/games">Games </Link>
            <Link to="/tv-shows">TV Shows </Link>
        </nav>
    );
}