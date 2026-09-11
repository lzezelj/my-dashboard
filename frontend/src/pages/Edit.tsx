import { Outlet } from "react-router-dom";
import EditNavbar from "../components/EditNavbar";
export default function Edit() {
    return (
        <main className="edit-page">
            <EditNavbar />
            <section className="edit-content">
                <Outlet />
            </section>
        </main>

    );
}
