import  { EventType } from "../generated/prisma/browser.js";
import {prisma} from "../lib/prisma.js";

export const getGamesService = async () => {
    return await prisma.game.findMany();
};
export const getGameService=async(id :number)=>{
    return prisma.game.findUnique({
        where:{
            id:id
        }
    })
};
export const createGameService=async(title:string,releaseDate:Date)=>{
    return prisma.game.create({
            data: {
                title,
                releaseDate
            }
        });
};
export const updateGameService=async(id:number,title:string,releaseDate:Date)=>{
    return prisma.game.update({
            where: { id },
            data: {
                title,
                releaseDate
            }
        });
};
export const deleteGameService=async(id:number)=>{
    return prisma.game.delete({
        where: { id }
    });
};
export const createGameEventService=async(sourceId:number)=>{
    const game = await prisma.game.findUnique({
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