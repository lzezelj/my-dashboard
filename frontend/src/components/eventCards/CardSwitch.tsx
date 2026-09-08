import MovieCard from "./MovieCard";
import TvShowCard from "./TvShowCard";
import GameCard from "./GameCard";
import BirthdayCard from "./BirthdayCard";
import AppointmentCard from "./AppointmentCard";
import TodoCard from "./TodoCard";

export default function CardSwitch({ event }: { event: any }) {
    switch (event.eventType) {
        case "MOVIE":
            return <MovieCard event={event} />;

        case "TV_SHOW":
            return <TvShowCard event={event} />;

        case "GAME":
            return <GameCard event={event} />;

        case "BIRTHDAY":
            return <BirthdayCard event={event} />;

        case "APPOINTMENT":
            return <AppointmentCard event={event} />;

        case "TODO":
            return <TodoCard event={event} />;
        default:
            return null;
    }
}