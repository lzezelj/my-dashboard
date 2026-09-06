import { useEffect, useState } from "react";
import type { Birthdays, UpdateBirthdays } from "../types/birthdays";
import { createBirthday, deleteBirthday, getBirthdays, updateBirthday, addToCalendar, removeFromCalendar } from "../services/birthdays.api.ts";

export default function Birthdays() {
    const [birthdays, setBirthdays] = useState<Birthdays[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [editName, setEditName] = useState("");
    const [editDate, setEditDate] = useState(new Date().toISOString().split("T")[0]);
    const [editingBirthdayId, setEditingBirthdayId] = useState<number | null>(null);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const convertedDate = (dateString: Date): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!name.trim()) {
            setError("Name cannot be empty.");
            return;
        }

        try {
            const newBirthday = await createBirthday({ name, date: new Date(date) });
            setBirthdays((currentBirthdays) => [...currentBirthdays, newBirthday]);
            setName("");
            setDate(new Date().toISOString().split("T")[0]);
        } catch (error) {
            setError("Could not create birthday.");
        }
    }
    async function handleUpdate(id: number, changes: UpdateBirthdays) {
        try {
            const updatedBirthday = await updateBirthday(id, changes);
            setBirthdays((currentBirthdays) =>
                currentBirthdays.map((birthday) =>
                    birthday.id === id ? updatedBirthday : birthday
                )
            );
        } catch (error) {
            setError("Could not update birthday.");
        }
    }
    async function handleDelete(id: number) {
        try {
            await deleteBirthday(id);
            setBirthdays((currentBirthdays) => currentBirthdays.filter((birthday) => birthday.id !== id));
        } catch (error) {
            setError("Could not delete birthday.");
        }
    }
    async function handleAddToCalendar(sourceId: number) {
        try {
            await addToCalendar(sourceId);
        } catch (error) {
            setError("Could not add birthday to calendar.");
        }
    }
    async function handleRemoveFromCalendar(sourceId: number) {
        try {
            await removeFromCalendar(sourceId);
        } catch (error) {
            setError("Could not remove birthday from calendar.");
        }
    }

    useEffect(() => {
        async function loadBirthdays() {
            try {
                const data = await getBirthdays();
                setBirthdays(data);
            } catch (error) {
                setError("Could not load birthdays.");
            } finally {
                setLoading(false);
            }
        }

        loadBirthdays();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    return (
        <div>
            <h1>Birthdays</h1>

            {birthdays.map((birthday) => (
                <div key={birthday.id}>
                    <button type="button" onClick={() => {
                        setEditingBirthdayId(editingBirthdayId === birthday.id ? null : birthday.id);
                        setEditName(birthday.name);
                        setEditDate(birthday.date.toISOString().split("T")[0]);
                    }}>
                         {editingBirthdayId === birthday.id ? "Cancel" : "Edit"}
                    </button>
                    {editingBirthdayId === birthday.id && (
                        <form onSubmit={(event) => {event.preventDefault(); handleUpdate(birthday.id, { name: editName, date: new Date(editDate) }); setEditingBirthdayId(null);}} >
                            <input name="name"  value={editName} onChange={(e) => setEditName(e.target.value)} />
                            <input name="date" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                            <button type="button" onClick={() => handleAddToCalendar(birthday.id)}>Add to calendar</button>
                            <button type="button" onClick={() => handleRemoveFromCalendar(birthday.id)}>Remove from calendar</button>
                            <button type="submit">Update Birthday</button>
                        </form>
                    )}
                    <p>
                        {birthday.name}
                    </p>     
                    <p>
                        {convertedDate(birthday.date)}
                    </p>
                    
                    <button type="button" onClick={() => handleDelete(birthday.id)}>
                        Delete Birthday
                    </button>
                </div>
            ))}
            <form onSubmit={handleSubmit}>
                <input name="name" placeholder="Enter the name of the person" value={name} onChange={(e) => setName(e.target.value)} />
                <input name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <button type="submit">Create Birthday</button>
            </form>
        </div>
       
    );
}