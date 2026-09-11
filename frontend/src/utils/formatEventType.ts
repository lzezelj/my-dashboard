import type { SourceEvents } from "../types/events";

export default function formatEventType(eventType: SourceEvents["eventType"]) {
    switch (eventType) {
        case "MOVIE":
            return "Movie";
        case "TV_SHOW":
            return "TV show";
        case "GAME":
            return "Game";
        case "BIRTHDAY":
            return "Birthday";
        case "APPOINTMENT":
            return "Appointment";
        case "TODO":
            return "Todo";
    }
}
