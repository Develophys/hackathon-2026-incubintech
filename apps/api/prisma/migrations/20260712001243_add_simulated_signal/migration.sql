-- CreateTable
CREATE TABLE "simulated_signals" (
    "id" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "checkIns" INTEGER NOT NULL,
    "concerning" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulated_signals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "simulated_signals_department_weekStart_key" ON "simulated_signals"("department", "weekStart");
