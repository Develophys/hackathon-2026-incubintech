import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaService } from "./prisma.service.ts";

describe("PrismaService", () => {
  const prisma = new PrismaService();

  beforeAll(async () => {
    await prisma.onModuleInit();
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  it("connects to Postgres and can execute a raw query", async () => {
    const result = await prisma.$queryRaw<Array<{ result: number }>>`SELECT 1 as result`;

    expect(result[0]?.result).toBe(1);
  });
});
