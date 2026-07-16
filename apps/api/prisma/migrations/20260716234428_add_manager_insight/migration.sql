-- CreateTable
CREATE TABLE "manager_insights" (
    "id" TEXT NOT NULL,
    "interpretation" TEXT NOT NULL,
    "suggestedActions" TEXT[],
    "summary" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "manager_insights_pkey" PRIMARY KEY ("id")
);
