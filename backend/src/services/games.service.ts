import type { EventType } from "../generated/prisma/browser.js";
import {prisma} from "../lib/prisma.js";

export const getGamesService = async () => {
    return await prisma.games.findMany();
};
export const getGameService=async(id :number)=>{
    return prisma.games.findUnique({
        where:{
            id:id
        }
    })
};
export const createGameService=async(title:string,released:Date)=>{
    return prisma.games.create({
            data: {
                title,
                released
            }
        });
};
export const updateGameService=async(id:number,title:string,released:Date)=>{
    return prisma.games.update({
            where: { id },
            data: {
                title,
                released
            }
        });
};
export const deleteGameService=async(id:number)=>{
    return prisma.games.delete({
        where: { id }
    });
};
export const createGameEventService=async(sourceId:number,type:EventType)=>{
    return prisma.event.create({
        data: {
            type,
            sourceId
        }
    });
}
export const deleteGameEventService=async(eventId:number)=>{
    return prisma.event.delete({
        where: { id:eventId }
    });
}