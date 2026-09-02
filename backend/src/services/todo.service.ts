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
export const updateTodoService=async(id:number,title:string)=>{
    return prisma.todo.update({
            where: { id },
            data: {
                title
            }
        });
};
export const deleteTodoService=async(id:number)=>{
    return prisma.todo.delete({
        where: { id }
    });
};