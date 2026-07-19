---
artifact_type: stakeholder-update
version: "1.0"
generated_at: 2026-07-19T00:00:00-03:00
generated_by_skill: foundation-stakeholder-update

meeting_title: "Esclarecimentos adicionais sobre respostas da ACM — protocolo de crise e apoio entre pares"
meeting_date: 2026-07-19

project: zelo
topics:
  - respostas-acm
  - escalonamento-crise
  - apoio-entre-pares

channel: email
audience_variant: customer-facing
primary_cta: "Responder duas perguntas objetivas, se possível até 22-23/07/2026."

thread_continuation_of: "Perguntas encaminhadas a ACM.pdf (respostas recebidas em 19/07/2026)"

related_recap: "raw input — não há recap de reunião; construído a partir de `Perguntas encaminhadas a ACM.pdf`, `adr-003-crisis-protocol-rescope-peer-chat-differentiator.md` e `2026-07-19-action-plan-respostas-acm.md` (Esforço P4)"

input_quality: high
confidence: high
visibility: public
status: draft
---

# Stakeholder update: Esclarecimentos adicionais para a ACM — Zelo

## Shareable update

---

### Email variant

**Assunto**: Hackathon: Burnout Médico: A Dor de Quem Cuida dos Outros — dúvidas adicionais

Prezado Dr. Marcello,

Duas perguntas rápidas e objetivas, se possível de responder até 22-23/07 — estamos numa reta final de 6 dias até a apresentação (25/07) e essas duas respostas fecham as últimas decisões de escopo.

Antes disso: muito obrigado pelas respostas de 19/07. Foram decisivas para o time re-priorizar o que falta construir nesta última semana — em especial a clareza de que o critério de avaliação está na robustez do fluxo triagem → direcionamento → follow-up, e não na integração técnica ao vivo que tínhamos desenhado originalmente para o protocolo de crise.

**1. Direcionamento diferenciado (SUS vs. plano de saúde/rede privada)**

Na resposta 1.2, o senhor mencionou "direcionamento diferenciado conforme o vínculo do profissional — rede SUS ou plano de saúde/rede privada". Existe uma lista ou diretório concreto de canais/serviços que a ACM recomenda o app apontar para cada caso? Ou devemos compilar isso de forma genérica por conta própria (ex.: CVV 188 sempre visível + orientação para o médico procurar o serviço de saúde ocupacional do hospital ou o canal de saúde mental do seu próprio plano de saúde)?

**2. Apoio entre pares como diferencial de produto**

Na resposta 1.4, o apoio entre pares foi descrito como direcionamento a canais profissionais curados (psicoterapia via SUS/rede privada/programas empresariais). Nosso time decidiu manter, adicionalmente, um atalho de conversa anônima com outro médico (par treinado) dentro do chat de acolhimento — essa decisão não nasceu de um pedido da ACM, e sim de uma entrevista real com um médico usuário, que relatou que abandonaria a conversa se percebesse estar falando com uma IA. O senhor vê essa camada extra como algo positivo e complementar ao direcionamento profissional que a ACM descreveu, ou prefere que concentremos o material da demo estritamente no fluxo triagem → direcionamento → follow-up, sem essa camada adicional?

Qualquer orientação sua ajuda a gente a não errar a mão na reta final. Seguimos à disposição para qualquer outro esclarecimento.

Atenciosamente,
Mauricio Alexandre
Time Zelo — 1ª Jornada Incubintech

---

## Notas de tradução técnico → negócio

**Traduções aplicadas**:

- "FR-7–FR-10", "FR-6b", "US-005" (nomenclatura interna da PRD) → removidos do e-mail; substituídos por linguagem de produto ("protocolo de crise", "atalho de conversa anônima com outro médico"), já que o destinatário é o demandante do desafio, não a equipe técnica.
- "ADR-003" (nomenclatura interna de decisão arquitetural) → não citada no e-mail; a lógica da decisão foi explicada em linguagem de produto no parágrafo de agradecimento.

**Sinalizado mas mantido** (pode precisar de revisão antes de enviar):

- Assinatura "Mauricio Alexandre" — confirmar se é esse o nome/cargo que deve assinar, ou se a comunicação oficial com a ACM deve vir de outra pessoa do time (ver `roadmap/README.md`, "a comunicação oficial com a organização da Jornada ainda não tem responsável definido").
- Nenhum prazo rígido foi imposto além de "22-23/07" — escolhido para dar 2-3 dias de margem antes da preparação final da demo (23-25/07), sem soar como cobrança indevida a um interlocutor que já demonstrou boa vontade.

---

## Fontes e Referências

### Entradas primárias

- `general-documentations/Perguntas encaminhadas a ACM.pdf` — respostas 1.2, 1.4, 4.1, e canal de contato ("Outros Esclarecimentos e Perguntas Reservadas")
- `general-documentations/documentacao-produto/adr-003-crisis-protocol-rescope-peer-chat-differentiator.md`
- `general-documentations/documentacao-produto/2026-07-19-action-plan-respostas-acm.md` — Esforço P4

### Artefatos referenciados

- `general-documentations/documentacao-produto/prd.md` — FR-7–FR-10, FR-6b
- `general-documentations/documentacao-produto/user-stories.md` — US-002 (AC-4), US-005

### Referências externas

- Nenhuma

### Contexto de geração

- **Gerado em**: 2026-07-19
- **Skill**: foundation-stakeholder-update
- **Canal**: email
- **Variante de audiência**: customer-facing (demandante externo do desafio)
- **Continuação de thread**: sim — dá sequência às respostas recebidas em 19/07/2026 ao primeiro lote de perguntas encaminhadas
- **Qualidade do input**: alta — perguntas objetivas, diretamente rastreáveis às respostas originais da ACM
- **Traduções aplicadas**: 2 — ver seção acima
