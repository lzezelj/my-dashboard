import { EventType } from "../generated/prisma/browser.js";
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
export const createTodoEventService=async(sourceId:number)=>{
    const todo = await prisma.todo.findUnique({
        where: { id: sourceId }
    });

    if (!todo) {
        throw new Error("Todo not found");
    }
    return prisma.event.create({
        data: {
            type: EventType.TODO,
            sourceId
        }
    });
}
export const deleteTodoEventService=async(sourceId:number)=>{
    return prisma.event.delete({
        where: { 
            type_sourceId: {
                type: EventType.TODO,
                sourceId
            }
        }
    });
}