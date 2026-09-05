import { EventType } from "../generated/prisma/client.js";
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
export const createTvShowService=async(title:string,releaseDate:Date)=>{
    return prisma.tvShow.create({
            data: {
                title,
                releaseDate
            }
        });
};
export const updateTvShowService=async(id:number,title:string,releaseDate:Date)=>{
    return prisma.tvShow.update({
            where: { id },
            data: {
                title,
                releaseDate
            }
        });
};
export const deleteTvShowService=async(id:number)=>{
    return prisma.tvShow.delete({
        where: { id }
    });
};
export const createTvShowEventService=async(sourceId:number)=>{
    const tvShow = await prisma.tvShow.findUnique({
        where: { id: sourceId }
    });

    if (!tvShow) {
        throw new Error("TV Show not found");
    }
    return prisma.event.create({
        data: {
            type: EventType.TV_SHOW,
            sourceId
        }
    });
}
export const deleteTvShowEventService=async(sourceId:number)=>{
    return prisma.event.delete({
        where: { 
            type_sourceId: {
                type: EventType.TV_SHOW,
                sourceId
            }
        }
    });
}