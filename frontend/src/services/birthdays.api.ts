import type { Birthdays, CreateBirthdays, UpdateBirthdays } from "../types/birthdays";


export async function getBirthdays(): Promise<Birthdays[]> {
    const response = await fetch("http://localhost:3000/api/birthdays");
    if (!response.ok) {
        throw new Error("Failed to fetch birthdays");
    }

    return response.json();
}
export async function createBirthday(birthday: CreateBirthdays): Promise<Birthdays> {
    const response = await fetch("http://localhost:3000/api/birthdays", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(birthday),
    });
    if (!response.ok) {
        throw new Error("Failed to create birthday");
    }
    return response.json();
}
export async function updateBirthday(id: number, birthday: UpdateBirthdays): Promise<Birthdays> {
    const response = await fetch(`http://localhost:3000/api/birthdays/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(birthday),
    });
    if (!response.ok) {
        throw new Error("Failed to update birthday");
    }
    return response.json();
}
export async function deleteBirthday(id: number): Promise<void> {
    const response = await fetch(`http://localhost:3000/api/birthdays/${id}`, {
        method: "DELETE",
    });
    if (!response.ok) {
        throw new Error("Failed to delete birthday");
    }
    return;
}
