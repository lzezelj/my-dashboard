import type { EventType } from "../generated/prisma/browser.js";
import {prisma} from "../lib/prisma.js";

export const getTodosService = async () => {
    return await prisma.todo.findMany();
};
export const getTodoService=async(id :number)=>{
    return prisma.todo.findUnique({
        where:{
            id:id
        }
    })
};
export const createTodoService=async(title:string)=>{
    return prisma.todo.create({
            data: {
                title
            }
        });
};
export const updateTodoService=async(id:number,title:string,completed:boolean)=>{
    return prisma.todo.update({
            where: { id },
            data: {
                title,
                completed
            }
        });
};
export const deleteTodoService=async(id:number)=>{
    return prisma.todo.delete({
        where: { id }
    });
};
export const createTodoEventService=async(sourceId:number,type:EventType)=>{
    return prisma.event.create({
        data: {
            type,
            sourceId
        }
    });
}
export const deleteTodoEventService=async(eventId:number)=>{
    return prisma.event.delete({
        where: { id:eventId }
    });
}