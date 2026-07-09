export interface DatabaseHealthPort {
  isReachable(): Promise<boolean>;
}

export const DATABASE_HEALTH_PORT = Symbol("DATABASE_HEALTH_PORT");
