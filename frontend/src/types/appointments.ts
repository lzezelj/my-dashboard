export interface Appointment {
    id: number;
    title: string;
    startTime:string;
    endTime:string;
}
export interface CreateAppointment{
    title: string;
    startTime:string;
    endTime:string;
}
export interface UpdateAppointment{
    title?: string;
    startTime:string;
    endTime:string;
}
