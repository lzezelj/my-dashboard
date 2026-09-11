import { EventType } from "../generated/prisma/browser.js";
import {prisma} from "../lib/prisma.js";

export const getAppointmentsService = async () => {
    return await prisma.appointment.findMany();
};
export const getAppointmentService=async(id :number)=>{
    return prisma.appointment.findUnique({
        where:{
            id:id
        }
    })
};
export const createAppointmentService=async(title:string,startTime:Date,endTime:Date)=>{
    return prisma.appointment.create({
            data: {
                title,
                startTime,
                endTime
            }
        });
};
export const updateAppointmentService=async(id:number,title:string,startTime:Date,endTime:Date)=>{
    return prisma.appointment.update({
            where: { id },
            data: {
                title,
                startTime,
                endTime
            }
        });
};
export const deleteAppointmentService=async(id:number)=>{
    return prisma.appointment.delete({
        where: { id }
    });
};
export const createAppointmentEventService=async(sourceId:number)=>{
    const appointment = await prisma.appointment.findUnique({
        where: { id: sourceId }
    });

    if (!appointment) {
        throw new Error("Appointment not found");
    }

    return prisma.event.create({
        data: {
            type: EventType.APPOINTMENT,
            sourceId
        }
    });
}
export const deleteAppointmentEventService=async(sourceId:number)=>{
    return prisma.event.delete({
        where: { 
            type_sourceId: {
                type: EventType.APPOINTMENT,
                sourceId
            }
        }
    });
}
export const updateAppointmentEventService=async(sourceId:number)=>{
    return prisma.event.update({
        where: { 
            type_sourceId: {
                type: EventType.APPOINTMENT,
                sourceId
            }
        },
        data: {
            type: EventType.APPOINTMENT,
            sourceId
        }
    });
}