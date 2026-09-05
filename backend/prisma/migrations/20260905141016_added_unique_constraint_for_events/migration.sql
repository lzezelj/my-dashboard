/*
  Warnings:

  - A unique constraint covering the columns `[type,sourceId]` on the table `Event` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Event_type_sourceId_key" ON "Event"("type", "sourceId");
