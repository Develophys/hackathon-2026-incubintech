import { describe, expect, it } from "vitest";
import { GetManagerSignalsUseCase } from "./get-manager-signals.use-case.ts";
import type { SimulatedSignalRepository, SimulatedSignalRow } from "../ports/simulated-signal-repository.port.ts";

class FakeSimulatedSignalRepository implements SimulatedSignalRepository {
  constructor(private readonly rows: SimulatedSignalRow[]) {}
  async findAll(): Promise<SimulatedSignalRow[]> {
    return this.rows;
  }
}

const WEEK_1 = new Date("2026-06-15T00:00:00.000Z");
const WEEK_2 = new Date("2026-06-22T00:00:00.000Z"); // most recent

describe("GetManagerSignalsUseCase", () => {
  it("computes segments from the most recent week only, excluding departments under k=5", async () => {
    const repository = new FakeSimulatedSignalRepository([
      { department: "B", weekStart: WEEK_2, checkIns: 10, concerning: 4 },
      { department: "A", weekStart: WEEK_1, checkIns: 10, concerning: 3 },
      { department: "C", weekStart: WEEK_1, checkIns: 4, concerning: 2 },
      { department: "A", weekStart: WEEK_2, checkIns: 10, concerning: 6 },
      { department: "C", weekStart: WEEK_2, checkIns: 4, concerning: 2 },
      { department: "B", weekStart: WEEK_1, checkIns: 10, concerning: 4 },
    ]);
    const useCase = new GetManagerSignalsUseCase(repository);

    const result = await useCase.execute();

    expect(result.segments).toEqual(
      expect.arrayContaining([
        { label: "A", value: 60, n: 10 },
        { label: "B", value: 40, n: 10 },
      ]),
    );
    expect(result.segments).toHaveLength(2); // "C" (n=4) suppressed
  });

  it("computes overallConcerningRate from only the visible departments' most recent week", async () => {
    const repository = new FakeSimulatedSignalRepository([
      { department: "A", weekStart: WEEK_2, checkIns: 10, concerning: 6 },
      { department: "B", weekStart: WEEK_2, checkIns: 10, concerning: 4 },
      { department: "C", weekStart: WEEK_2, checkIns: 4, concerning: 2 },
    ]);
    const useCase = new GetManagerSignalsUseCase(repository);

    const result = await useCase.execute();

    expect(result.overallConcerningRate).toBe(0.5); // (6+4)/(10+10), C excluded
  });

  it("computes weeklyTrend and checkInsLast4Weeks as org-wide sums including the suppressed department", async () => {
    const repository = new FakeSimulatedSignalRepository([
      { department: "A", weekStart: WEEK_1, checkIns: 10, concerning: 3 },
      { department: "A", weekStart: WEEK_2, checkIns: 10, concerning: 6 },
      { department: "B", weekStart: WEEK_1, checkIns: 10, concerning: 4 },
      { department: "B", weekStart: WEEK_2, checkIns: 10, concerning: 4 },
      { department: "C", weekStart: WEEK_1, checkIns: 4, concerning: 2 },
      { department: "C", weekStart: WEEK_2, checkIns: 4, concerning: 2 },
    ]);
    const useCase = new GetManagerSignalsUseCase(repository);

    const result = await useCase.execute();

    expect(result.weeklyTrend).toEqual([
      { weekStart: WEEK_1.toISOString(), concerningRate: 0.375 }, // (3+4+2)/(10+10+4)
      { weekStart: WEEK_2.toISOString(), concerningRate: 0.5 }, // (6+4+2)/(10+10+4)
    ]);
    expect(result.checkInsLast4Weeks).toBe(48); // both weeks, all 3 departments: 24+24
  });

  it("sums only the trailing 4 weeks for checkInsLast4Weeks when more than 4 weeks exist", async () => {
    const weeks = [
      new Date("2026-06-01T00:00:00.000Z"),
      new Date("2026-06-08T00:00:00.000Z"),
      new Date("2026-06-15T00:00:00.000Z"),
      new Date("2026-06-22T00:00:00.000Z"),
      new Date("2026-06-29T00:00:00.000Z"),
    ];
    const repository = new FakeSimulatedSignalRepository(
      weeks.map((weekStart) => ({ department: "A", weekStart, checkIns: 10, concerning: 5 })),
    );
    const useCase = new GetManagerSignalsUseCase(repository);

    const result = await useCase.execute();

    expect(result.checkInsLast4Weeks).toBe(40); // trailing 4 of 5 weeks, not all 5 (which would be 50)
    expect(result.weeklyTrend).toHaveLength(5); // but the trend still returns every week
  });

  it("returns 0 for overallConcerningRate (not NaN) when every department is suppressed", async () => {
    const repository = new FakeSimulatedSignalRepository([
      { department: "Tiny", weekStart: WEEK_2, checkIns: 2, concerning: 1 },
    ]);
    const useCase = new GetManagerSignalsUseCase(repository);

    const result = await useCase.execute();

    expect(result.segments).toEqual([]);
    expect(result.overallConcerningRate).toBe(0);
    expect(result.checkInsLast4Weeks).toBe(2); // org-wide sum still includes the suppressed dept
  });

  it("returns all-zero/empty output for an unseeded (empty) database, without crashing", async () => {
    const repository = new FakeSimulatedSignalRepository([]);
    const useCase = new GetManagerSignalsUseCase(repository);

    const result = await useCase.execute();

    expect(result).toEqual({
      overallConcerningRate: 0,
      checkInsLast4Weeks: 0,
      weeklyTrend: [],
      segments: [],
    });
  });
});
