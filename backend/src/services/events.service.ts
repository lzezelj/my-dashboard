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
