import  { EventType } from "../generated/prisma/browser.js";
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
export const createGameEventService=async(sourceId:number)=>{
    const game = await prisma.games.findUnique({
        where: { id: sourceId }
    });

    if (!game) {
        throw new Error("Game not found");
    }

    return prisma.event.create({
        data: {
            type: EventType.GAME,
            sourceId
        }
    });
}
export const deleteGameEventService=async(sourceId:number)=>{
    return prisma.event.delete({
        where: { 
            type_sourceId: {
                type: EventType.GAME,
                sourceId
            }
        }
    });
}