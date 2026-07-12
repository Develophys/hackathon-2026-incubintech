export interface SimulatedSignalRow {
  department: string;
  weekStart: Date;
  checkIns: number;
  concerning: number;
}

export interface SimulatedSignalRepository {
  findAll(): Promise<SimulatedSignalRow[]>;
}

export const SIMULATED_SIGNAL_REPOSITORY = Symbol("SIMULATED_SIGNAL_REPOSITORY");
