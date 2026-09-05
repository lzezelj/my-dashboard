import { EventType } from "../generated/prisma/browser.js";
import {prisma} from "../lib/prisma.js";

export const getMoviesService = async () => {
    return await prisma.movie.findMany();
};
export const getMovieService=async(id :number)=>{
    return prisma.movie.findUnique({
        where:{
            id:id
        }
    })
};
export const createMovieService=async(title:string,releaseDate:Date)=>{
    return prisma.movie.create({
            data: {
                title,
                releaseDate
            }
        });
};
export const updateMovieService=async(id:number,title:string,releaseDate:Date)=>{
    return prisma.movie.update({
            where: { id },
            data: {
                title,
                releaseDate
            }
        });
};
export const deleteMovieService=async(id:number)=>{
    return prisma.movie.delete({
        where: { id }
    });
};
export const createMovieEventService=async(sourceId:number)=>{
    const movie = await prisma.movie.findUnique({
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