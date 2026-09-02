import {prisma} from "../lib/prisma.js";

export const getEventsService = async () => {
    return await prisma.calendarEvent.findMany();
};
export const getEventService=async(id :number)=>{
    return prisma.calendarEvent.findUnique({
        where:{
            id:id
        }
    })
};
export const createEventService=async(title:string,description:string, startDate: Date, endDate: Date)=>{
    return prisma.calendarEvent.create({
            data: {
                title,
                description,
                startDate,
                endDate
            }
        });
};
export const updateEventService=async(id:number,title:string,description:string, startDate: Date, endDate: Date)=>{
    return prisma.calendarEvent.update({
            where: { id },
            data: {
                title,
                description,
                startDate,
                endDate
            }
        });
};
export const deleteEventService=async(id:number)=>{
    return prisma.calendarEvent.delete({
        where: { id }
    });
};