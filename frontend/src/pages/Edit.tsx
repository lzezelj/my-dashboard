import {Outlet} from "react-router-dom";
import EditNavbar from "../components/EditNavbar";
export default function Edit() {
    return (
        <div>
            <h1>Edit</h1>
            <EditNavbar />
            <Outlet />
        </div>
        
    );
}