import {prisma} from "../lib/prisma.js";
import {EventType} from "../generated/prisma/client.js";

export const getEventsService = async () => {
    return await prisma.event.findMany();
};
export const getCalendarEventService=async(event: { type: EventType; sourceId: number, id:number })=>{
    
    switch (event.type) {
    case EventType.MOVIE: {
            const source = await prisma.movie.findUnique({
                where: { id: event.sourceId }
            });

            return {
                id: event.id,
                title: source!.title,
                date: source!.releaseDate,
                sourceId: event.sourceId,
            };
        }

        case EventType.TV_SHOW: {
            const source = await prisma.tvShow.findUnique({
                where: { id: event.sourceId }
            });
            return {
                id: event.id,
                title: source!.title,
                date: source!.releaseDate,
                sourceId: event.sourceId,
            };
        }

        case EventType.GAME: {
            const source = await prisma.game.findUnique({
                where: { id: event.sourceId }
            });

            return {
                id: event.id,
                title: source!.title,
                date: source!.releaseDate,
                sourceId: event.sourceId,
            };
        }

        case EventType.BIRTHDAY: {
            const source = await prisma.birthday.findUnique({
                where: { id: event.sourceId }
            });

            return {
                id: event.id,
                title: source!.name,
                date: source!.date,
                sourceId: event.sourceId,
            };
        }

        case EventType.APPOINTMENT: {
            const source = await prisma.appointment.findUnique({
                where: { id: event.sourceId }
            });
            return {
                id: event.id,
                title: source!.title,
                date: source!.startTime,
                sourceId: event.sourceId,
            };
        }

        default:
            throw new Error("Unsupported event type");
    }
};
export const getSourceEventService = async (event: {
    type: EventType;
    sourceId: number;
}) => {
    switch (event.type) {
        case EventType.MOVIE:
            return prisma.movie.findUnique({
                where: { id: event.sourceId }
            });

        case EventType.TV_SHOW:
            return prisma.tvShow.findUnique({
                where: { id: event.sourceId }
            });

        case EventType.GAME:
            return prisma.game.findUnique({
                where: { id: event.sourceId }
            });

        case EventType.BIRTHDAY:
            return prisma.birthday.findUnique({
                where: { id: event.sourceId }
            });

        case EventType.APPOINTMENT:
            return prisma.appointment.findUnique({
                where: { id: event.sourceId }
            });

        default:
            throw new Error("Unsupported event type");
    }
};