import { EventType } from "../generated/prisma/browser.js";
import {prisma} from "../lib/prisma.js";

export const getBirthdaysService = async () => {
    return await prisma.birthday.findMany();
};
export const getBirthdayService=async(id :number)=>{
    return prisma.birthday.findUnique({
        where:{
            id:id
        }
    })
};
export const createBirthdayService=async(name:string,date:Date)=>{
    return prisma.birthday.create({
            data: {
                name,
                date
            }
        });
};
export const updateBirthdayService=async(id:number,name:string,date:Date)=>{
    return prisma.birthday.update({
            where: { id },
            data: {
                name,
                date,
            }
        });
};
export const deleteBirthdayService=async(id:number)=>{
    return prisma.birthday.delete({
        where: { id }
    });
};
export const createBirthdayEventService=async(sourceId:number)=>{
    const birthday = await prisma.birthday.findUnique({
        where: { id: sourceId }
    });

    if (!birthday) {
        throw new Error("Birthday not found");
    }
    return prisma.event.create({
        data: {
            type: EventType.BIRTHDAY,
            sourceId
        }
    });
}
export const deleteBirthdayEventService=async(sourceId:number)=>{
    return prisma.event.delete({
        where: { 
            type_sourceId: {
                type: EventType.BIRTHDAY,
                sourceId
            }
        }
    });
}