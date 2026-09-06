import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
    const location = useLocation();

    const isEditPage = location.pathname.startsWith("/edit");

    return (
        <nav className="navbar">
            <Link to="/home">Home</Link>

            {!isEditPage && (
                <Link to="/edit">Edit</Link>
            )}
        </nav>
    );
}