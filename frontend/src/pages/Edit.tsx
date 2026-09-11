import { Outlet } from "react-router-dom";
import { useRef, useState } from "react";
import EditNavbar from "../components/EditNavbar";
import Toast from "../components/Toast";

export type EditOutletContext = {
    showToast: (message: string) => void;
};

export default function Edit() {
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const toastTimeout = useRef<number | null>(null);

    function showToast(message: string) {
        setToastMessage(message);
        if (toastTimeout.current !== null) window.clearTimeout(toastTimeout.current);
        toastTimeout.current = window.setTimeout(() => setToastMessage(null), 5000);
    }

    return (
        <main className="edit-page">
            <EditNavbar />
            <section className="edit-content">
                <Outlet context={{ showToast } satisfies EditOutletContext} />
            </section>
            <Toast message={toastMessage} />
        </main>

    );
}
