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