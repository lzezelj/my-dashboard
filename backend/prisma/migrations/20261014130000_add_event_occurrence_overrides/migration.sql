CREATE TABLE "EventOccurrenceOverride" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "occurrenceDate" DATE NOT NULL,
    "description" TEXT,
    CONSTRAINT "EventOccurrenceOverride_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "EventOccurrenceOverride_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "EventOccurrenceOverride_eventId_occurrenceDate_key" ON "EventOccurrenceOverride"("eventId", "occurrenceDate");
