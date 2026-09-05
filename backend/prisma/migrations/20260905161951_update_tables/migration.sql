/*
  Warnings:

  - You are about to drop the column `released` on the `TvShow` table. All the data in the column will be lost.
  - You are about to drop the `Games` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Movies` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `releaseDate` to the `TvShow` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "deadline" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TvShow" DROP COLUMN "released",
ADD COLUMN     "releaseDate" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "Games";

-- DropTable
DROP TABLE "Movies";

-- CreateTable
CREATE TABLE "Movie" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);
