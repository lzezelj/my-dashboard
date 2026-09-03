import {prisma} from "../lib/prisma.js";
import {EventType} from "../generated/prisma/client.js";
export const getEventsService = async () => {
    return await prisma.event.findMany();
};
export const getEventService=async(id :number)=>{
    return prisma.event.findUnique({
        where:{
            id:id
        }
    })
};
export const createEventService=async(title:string,description:string, startDate: Date, endDate: Date, allDay: boolean, type: EventType)=>{
    return prisma.event.create({
            data: {
                title,
                allDay,
                description,
                startDate,
                endDate,
                type
            }
        });
};
export const updateEventService=async(id:number,title:string,description:string, startDate: Date, endDate: Date, allDay: boolean, type: EventType)=>{
    return prisma.event.update({
            where: { id },
            data: {
                title,
                description,
                allDay,
                type
            }
        });
};
export const deleteEventService=async(id:number)=>{
    return prisma.event.delete({
        where: { id }
    });
};