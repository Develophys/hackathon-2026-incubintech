import { PrismaService } from "../src/shared/prisma/prisma.service.ts";
import { buildFollowUpSeedRows, buildSeedRows } from "./seed-data.ts";

async function main() {
  const prisma = new PrismaService();
  const rows = buildSeedRows(new Date());
  const followUpRows = buildFollowUpSeedRows(new Date());

  await prisma.simulatedSignal.deleteMany();
  await prisma.simulatedSignal.createMany({ data: rows });

  await prisma.simulatedFollowUp.deleteMany();
  await prisma.simulatedFollowUp.createMany({ data: followUpRows });

  console.log(`Seeded ${rows.length} SimulatedSignal rows and ${followUpRows.length} SimulatedFollowUp rows.`);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
