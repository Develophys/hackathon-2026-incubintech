export interface HumanHandoffInfo {
  message: string;
  externalCrisisLine: { label: string; phone: string };
}

/**
 * Deliberately synchronous and I/O-free — no port, no network call. FR-6b
 * requires this shortcut to work even when the AI provider (or the network)
 * is unavailable, so it cannot depend on anything that can fail (spec Section D).
 * Peer-matching/psychologist connection is Week 2 scope (not yet built); until
 * then this surfaces the external crisis line directly, matching the PRD's
 * documented edge case for "no par ou psicólogo disponível."
 */
export class RequestHumanHandoffUseCase {
  execute(): HumanHandoffInfo {
    return {
      message:
        "Você pode falar com uma pessoa de verdade a qualquer momento desta conversa. Esta linha está sempre disponível:",
      externalCrisisLine: { label: "CVV - Centro de Valorização da Vida", phone: "188" },
    };
  }
}
