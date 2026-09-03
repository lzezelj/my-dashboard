import {Link} from "react-router-dom";

export default function Navbar() { 
    return (
        <nav>
            <Link to="/">Home</Link>
            <Link to="/todos">Todos</Link>
            <Link to="/movies">Movies</Link>
        </nav>
    );
}