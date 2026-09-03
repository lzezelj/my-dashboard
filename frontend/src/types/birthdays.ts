export interface Birthdays {
    id: number;
    name: string;
    date: Date
}
export interface CreateBirthdays{
    name: string;
    date: Date
}
export interface UpdateBirthdays{
    name?: string;
    date?: Date;
}
