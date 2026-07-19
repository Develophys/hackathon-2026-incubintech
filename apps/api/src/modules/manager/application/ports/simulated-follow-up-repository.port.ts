export interface SimulatedFollowUpRow {
  weekStart: Date;
  sent: number;
  responded: number;
}

export interface SimulatedFollowUpRepository {
  findAll(): Promise<SimulatedFollowUpRow[]>;
}

export const SIMULATED_FOLLOW_UP_REPOSITORY = Symbol("SIMULATED_FOLLOW_UP_REPOSITORY");
