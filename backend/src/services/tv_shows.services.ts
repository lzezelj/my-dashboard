import type { EventType } from "../generated/prisma/client.js";
import {prisma} from "../lib/prisma.js";

export const getTvShowsService = async () => {
    return await prisma.tvShow.findMany();
};
export const getTvShowService=async(id :number)=>{
    return prisma.tvShow.findUnique({
        where:{
            id:id
        }
    })
};
export const createTvShowService=async(title:string,released:Date)=>{
    return prisma.tvShow.create({
            data: {
                title,
                released
            }
        });
};
export const updateTvShowService=async(id:number,title:string,released:Date)=>{
    return prisma.tvShow.update({
            where: { id },
            data: {
                title,
                released
            }
        });
};
export const deleteTvShowService=async(id:number)=>{
    return prisma.tvShow.delete({
        where: { id }
    });
};
export const createTvShowEventService=async(sourceId:number,type:EventType)=>{
    return prisma.event.create({
        data: {
            type,
            sourceId
        }
    });
}
export const deleteTvShowEventService=async(eventId:number)=>{
    return prisma.event.delete({
        where: { id:eventId }
    });
}