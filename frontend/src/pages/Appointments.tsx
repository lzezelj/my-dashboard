import { useEffect, useState } from "react";
import type { Appointment, UpdateAppointment} from "../types/appointments.ts";
import { createAppointment, getAppointments,deleteAppointment,updateAppointment } from "../services/Appointments.api.ts";
import { isoToTimeInputValue,isoToDisplayDate, isoToDateInputValue, dateTimeToISOString,getCurrentTime,getTimePlusOneMinute } from "../utils/dateUtils.ts";
export default function Appointments() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [startTime,setStartTime]=useState(getCurrentTime());
    const [endTime,setEndTime]=useState(getTimePlusOneMinute());
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [editTitle, setEditTitle] = useState("");
    const [editStartTime, setEditStartTime] = useState("");
    const [editDate, setEditDate] = useState("");
    const [editEndTime, setEditEndTime] = useState("");
    const [editingAppointmentId, setEditingAppointmentId] = useState<number | null>(null);
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!title.trim()) {
            setError("Title cannot be empty.");
            return;
        }
        if (!date || !startTime || !endTime) {
            setError("Date, start time and end time are required.");
            return;
        }

        try {
            const newAppointment = await createAppointment({title,startTime: new Date(`${date}T${startTime}`).toISOString(),endTime: new Date(`${date}T${endTime}`).toISOString()});
            setAppointments((currentAppointments) => [...currentAppointments, newAppointment]);
            setTitle("");
            setDate(new Date().toISOString().split("T")[0]);
            setStartTime(getCurrentTime());
            setEndTime(getTimePlusOneMinute());
            setError(null);
        } catch (error) {
            setError("Could not create appointment.");
        }
    }
    async function handleUpdate(id: number, changes: UpdateAppointment) {
        try {
            const updatedAppointment = await updateAppointment(id, changes);
            setAppointments((currentAppointment) =>
                currentAppointment.map((appointment) =>
                    appointment.id === id ? updatedAppointment : appointment
                )
            );
        } catch (error) {
            setError("Could not update appointment.");
        }
    }
    async function handleDelete(id: number) {
        try {
            await deleteAppointment(id);
            setAppointments((currentAppointments) => currentAppointments.filter((appointment) => appointment.id !== id));
        } catch (error) {
            setError("Could not delete appointment.");
        }
    }


    useEffect(() => {
        async function loadAppointments() {
            try {
                const data = await getAppointments();
                setAppointments(data);
            } catch (error) {
                setError("Could not load appointments.");
            } finally {
                setLoading(false);
            }
        }

        loadAppointments();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div>
            <h1>Appointments</h1>

            {appointments.map((appointment) => (
                <div key={appointment.id}>
                    <button
                    type="button"
                    onClick={() => {
                        setEditingAppointmentId(appointment.id);
                        setEditTitle(appointment.title);
                        setEditDate(isoToDateInputValue(appointment.startTime));
                        setEditStartTime(isoToTimeInputValue(appointment.startTime));
                        setEditEndTime(isoToTimeInputValue(appointment.endTime));
                    }}>
                         {editingAppointmentId === appointment.id ? "Cancel" : "Edit"}
                    </button>
                    {editingAppointmentId === appointment.id && (
                        <form onSubmit={(event) => {event.preventDefault(); handleUpdate(appointment.id, { title:editTitle, startTime: dateTimeToISOString(editDate, editStartTime),endTime: dateTimeToISOString(editDate, editEndTime) }); setEditingAppointmentId(null);}} >
                            <input name="title"  value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                            <input type="date" min={new Date().toISOString().split("T")[0]} value={editDate} onChange={(e)=>setEditDate(e.target.value)}/>
                            <input type="time" min ={editDate===new Date().toISOString().split("T")[0] ? getCurrentTime() : undefined} value={editStartTime} onChange={(e) => setEditStartTime(e.target.value)} />
                            <input type="time"  min ={editDate===new Date().toISOString().split("T")[0] ? editStartTime : undefined} value={editEndTime} onChange={(e) => setEditEndTime(e.target.value)} />
                            <button type="submit">Update appointment</button>
                        </form>
                    )}
                        <p>{appointment.title}</p>
                        <p>{isoToTimeInputValue(appointment.startTime)} - {isoToTimeInputValue(appointment.endTime)} </p>
                        <p>{isoToDisplayDate(appointment.startTime)} </p>
                    <button type="button" onClick={() => handleDelete(appointment.id)}>
                        Delete appointment
                    </button>
                </div>
            ))}
            <form onSubmit={handleSubmit}>
                <input name="title" placeholder="Enter a appointment" value={title} onChange={(e) => setTitle(e.target.value)} />
                <input type="date" value={date} min={new Date().toISOString().split("T")[0]} onChange={(e) => setDate(e.target.value)}/>
                <input type="time" min ={date===new Date().toISOString().split("T")[0] ? getCurrentTime() : undefined} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                <input type="time"  min ={date===new Date().toISOString().split("T")[0] ? startTime : undefined} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                <button type="submit">Create appointment</button>
            </form>
        </div>
       
    );
}