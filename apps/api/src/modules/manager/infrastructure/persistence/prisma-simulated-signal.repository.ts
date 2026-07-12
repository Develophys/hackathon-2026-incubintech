import { Inject, Injectable } from "@nestjs/common";
import type { SimulatedSignalRepository, SimulatedSignalRow } from "../../application/ports/simulated-signal-repository.port.ts";
import { PrismaService } from "../../../../shared/prisma/prisma.service.ts";

@Injectable()
export class PrismaSimulatedSignalRepository implements SimulatedSignalRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAll(): Promise<SimulatedSignalRow[]> {
    const rows = await this.prisma.simulatedSignal.findMany();
    return rows.map((row) => ({
      department: row.department,
      weekStart: row.weekStart,
      checkIns: row.checkIns,
      concerning: row.concerning,
    }));
  }
}
