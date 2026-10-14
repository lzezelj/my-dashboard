ALTER TABLE "Event"
  ADD COLUMN "externalUid" TEXT,
  ADD COLUMN "timeZone" TEXT,
  ADD COLUMN "allDay" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "location" TEXT,
  ADD COLUMN "url" TEXT,
  ADD COLUMN "recurrenceRule" TEXT,
  ADD COLUMN "status" TEXT,
  ADD COLUMN "sequence" INTEGER,
  ADD COLUMN "originalIcs" TEXT;

-- Existing date-only events are all-day events.
UPDATE "Event" SET "allDay" = true WHERE "date" IS NOT NULL;

CREATE INDEX "Event_userId_externalUid_idx" ON "Event"("userId", "externalUid");

CREATE TABLE "EventRecurrenceDate" (
  "id" SERIAL NOT NULL,
  "eventId" INTEGER NOT NULL,
  "value" TEXT NOT NULL,
  CONSTRAINT "EventRecurrenceDate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EventRecurrenceDate_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "EventRecurrenceDate_eventId_value_key"
  ON "EventRecurrenceDate"("eventId", "value");

CREATE TABLE "EventExclusionDate" (
  "id" SERIAL NOT NULL,
  "eventId" INTEGER NOT NULL,
  "value" TEXT NOT NULL,
  CONSTRAINT "EventExclusionDate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "EventExclusionDate_eventId_fkey"
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "EventExclusionDate_eventId_value_key"
  ON "EventExclusionDate"("eventId", "value");
