import type { EventType } from "../generated/prisma/browser.js";
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
export const createBirthdayEventService=async(sourceId:number,type:EventType)=>{
    return prisma.event.create({
        data: {
            type,
            sourceId
        }
    });
}
export const deleteBirthdayEventService=async(eventId:number)=>{
    return prisma.event.delete({
        where: { id:eventId }
    });
}