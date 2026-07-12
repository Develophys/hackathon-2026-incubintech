import { PrismaService } from "../src/shared/prisma/prisma.service.ts";
import { buildSeedRows } from "./seed-data.ts";

async function main() {
  const prisma = new PrismaService();
  const rows = buildSeedRows(new Date());

  await prisma.simulatedSignal.deleteMany();
  await prisma.simulatedSignal.createMany({ data: rows });

  console.log(`Seeded ${rows.length} SimulatedSignal rows.`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
