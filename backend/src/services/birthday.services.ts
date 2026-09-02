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