-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "scaleType" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);
