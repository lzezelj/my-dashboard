ALTER TABLE "User"
ADD COLUMN "demoUsername" TEXT,
ADD COLUMN "passwordHash" TEXT,
ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "User_demoUsername_key" ON "User"("demoUsername");
