import { EventType } from "../generated/prisma/browser.js";
import {prisma} from "../lib/prisma.js";

export const getMoviesService = async () => {
    return await prisma.movies.findMany();
};
export const getMovieService=async(id :number)=>{
    return prisma.movies.findUnique({
        where:{
            id:id
        }
    })
};
export const createMovieService=async(title:string,released:Date)=>{
    return prisma.movies.create({
            data: {
                title,
                released
            }
        });
};
export const updateMovieService=async(id:number,title:string,released:Date)=>{
    return prisma.movies.update({
            where: { id },
            data: {
                title,
                released
            }
        });
};
export const deleteMovieService=async(id:number)=>{
    return prisma.movies.delete({
        where: { id }
    });
};
export const createMovieEventService=async(sourceId:number)=>{
    const movie = await prisma.movies.findUnique({
        where: { id: sourceId }
    });

    if (!movie) {
        throw new Error("Movie not found");
    }

    return prisma.event.create({
        data: {
            type: EventType.MOVIE,
            sourceId
        }
    });
}
export const deleteMovieEventService=async(sourceId:number)=>{
    return prisma.event.delete({
        where: { 
            type_sourceId: {
                type: EventType.MOVIE,
                sourceId
            }
        }
    });
}