export type ProfessionalBond = "sus" | "private";

export interface CrisisDirectionInfo {
  bond: ProfessionalBond;
  title: string;
  message: string;
}

const DIRECTIONS: Record<ProfessionalBond, Omit<CrisisDirectionInfo, "bond">> = {
  sus: {
    title: "Rede SUS",
    message:
      "Procure o CAPS (Centro de Atenção Psicossocial) mais próximo ou o serviço de saúde mental da sua unidade de saúde. Se for uma emergência, o CVV também pode ajudar agora.",
  },
  private: {
    title: "Plano de saúde / rede privada",
    message:
      "Entre em contato com a central do seu plano de saúde ou com o serviço de saúde ocupacional do hospital para acionar o atendimento em saúde mental da sua rede. Se for uma emergência, o CVV também pode ajudar agora.",
  },
};

// TODO(acm-response): replace DIRECTIONS' messages with the concrete channel list once
// the ACM answers the clarifying e-mail sent 19/07/2026 (see
// general-documentations/documentacao-produto/2026-07-19_stakeholder-update-email-esclarecimentos-acm.md).
export class GetCrisisDirectionUseCase {
  execute(bond: ProfessionalBond): CrisisDirectionInfo {
    return { bond, ...DIRECTIONS[bond] };
  }
}
