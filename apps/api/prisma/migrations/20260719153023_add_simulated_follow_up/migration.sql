-- CreateTable
CREATE TABLE "simulated_follow_ups" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "sent" INTEGER NOT NULL,
    "responded" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulated_follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "simulated_follow_ups_weekStart_key" ON "simulated_follow_ups"("weekStart");
