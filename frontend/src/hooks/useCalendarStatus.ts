import { useCallback, useEffect, useState } from "react";
import { getSourceEvents } from "../services/home.api";
import type { SourceEvents } from "../types/events";

export default function useCalendarStatus(eventType: SourceEvents["eventType"]) {
    const [calendarSourceIds, setCalendarSourceIds] = useState<Set<number>>(new Set());

    const loadCalendarSourceIds = useCallback(async () => {
        const sourceEvents = await getSourceEvents();
        return new Set(
            sourceEvents
                .filter((event) => event.eventType === eventType)
                .map((event) => event.id)
        );
    }, [eventType]);

    const refreshCalendarStatus = useCallback(async () => {
        setCalendarSourceIds(await loadCalendarSourceIds());
    }, [loadCalendarSourceIds]);

    useEffect(() => {
        let isCurrent = true;

        loadCalendarSourceIds().then((sourceIds) => {
            if (isCurrent) {
                setCalendarSourceIds(sourceIds);
            }
        }).catch((error) => {
            console.error("Could not load calendar status.", error);
        });

        return () => {
            isCurrent = false;
        };
    }, [loadCalendarSourceIds]);

    return { calendarSourceIds, refreshCalendarStatus };
}
