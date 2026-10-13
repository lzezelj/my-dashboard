-- Destructive recovery migration: legacy dashboard entries are intentionally discarded.
-- It also removes objects left by an interrupted earlier attempt at this migration.
DROP TABLE IF EXISTS "Event" CASCADE;
DROP TABLE IF EXISTS "LegacyEvent" CASCADE;
DROP TABLE IF EXISTS "Todo" CASCADE;
DROP TABLE IF EXISTS "Movie" CASCADE;
DROP TABLE IF EXISTS "TvShow" CASCADE;
DROP TABLE IF EXISTS "Game" CASCADE;
DROP TABLE IF EXISTS "Birthday" CASCADE;
DROP TABLE IF EXISTS "Appointment" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TYPE IF EXISTS "EventType" CASCADE;
DROP TYPE IF EXISTS "LegacyEventType" CASCADE;
DROP TYPE IF EXISTS "EventCategory" CASCADE;
DROP TYPE IF EXISTS "Recurrence" CASCADE;

CREATE TYPE "EventCategory" AS ENUM ('APPOINTMENT', 'BIRTHDAY', 'MOVIE', 'TV_SHOW', 'GAME', 'TODO', 'OTHER');
CREATE TYPE "Recurrence" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "googleId" TEXT,
    "email" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "category" "EventCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "date" DATE,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "description" TEXT,
    "recurring" "Recurrence",
    "numberOfRecurrences" INTEGER,
    "allowCompletion" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Event_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Event_userId_category_idx" ON "Event"("userId", "category");
CREATE INDEX "Event_date_idx" ON "Event"("date");
CREATE INDEX "Event_startTime_idx" ON "Event"("startTime");
