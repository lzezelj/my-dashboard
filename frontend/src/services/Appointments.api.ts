import type { Appointment,CreateAppointment, UpdateAppointment } from "../types/appointments";


export async function getAppointments(): Promise<Appointment[]> {
    const response = await fetch("http://localhost:3000/api/appointments");
    if (!response.ok) {
        throw new Error("Failed to fetch appointments");
    }

    return response.json();
}
export async function createAppointment(appointment: CreateAppointment): Promise<Appointment> {
    const response = await fetch("http://localhost:3000/api/appointments", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(appointment),
    });
    if (!response.ok) {
        throw new Error("Failed to create appointments");
    }
    return response.json();
}
export async function updateAppointment(id: number, appointment: UpdateAppointment): Promise<Appointment> {
    const response = await fetch(`http://localhost:3000/api/appointments/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(appointment),
    });
    if (!response.ok) {
        throw new Error("Failed to update appointment");
    }
    return response.json();
}
export async function deleteAppointment(id: number): Promise<void> {
    const response = await fetch(`http://localhost:3000/api/appointments/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Failed to delete appointment");
    }
    
}
export async function addToCalendar(sourceId:number): Promise<void> {
    const response = await fetch(`http://localhost:3000/api/appointments/${sourceId}/event`, {
        method: "POST",
    });
    if (!response.ok) {
        throw new Error("Failed to add appointment to calendar");
    }
    return;
}
export async function removeFromCalendar(sourceId:number): Promise<void> {
    const response = await fetch(`http://localhost:3000/api/appointments/${sourceId}/event`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Failed to remove appointment from calendar");
    }
    return;
}