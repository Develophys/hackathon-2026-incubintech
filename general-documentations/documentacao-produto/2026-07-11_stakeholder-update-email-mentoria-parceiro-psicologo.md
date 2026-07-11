---
artifact_type: stakeholder-update
version: 1.0
generated_at: 2026-07-11T14:00:00-03:00
generated_by_skill: foundation-stakeholder-update

meeting_title: "Confirmação de parceiro psicólogo — caminho de aceite em crise do Zelo"
meeting_date: 2026-07-11

project: zelo
topics:
  - parceiro-psicologo
  - escalonamento-crise

channel: email
audience_variant: customer-facing
primary_cta: "Confirmar, até 15/07/2026, se há indicação de psicólogo(a) parceiro(a) disponível para o caminho de aceite em crise (resposta objetiva sim/não)."

thread_continuation_of: null

related_recap: "raw input — não há recap de reunião associado; construído a partir de prd.md (Dependências) e okrs.md (Iniciativa 3)"

input_quality: medium
confidence: medium
visibility: public
status: draft
---

# Stakeholder update: Confirmação de parceiro psicólogo — Zelo

## Shareable update

---

### Email variant

**Subject**: Zelo — precisamos de uma resposta até 15/07 sobre parceiro psicólogo para o caminho de crise

Hi, equipe de mentoria da 1ª Jornada Incubintech,

Escrevo sobre um dos pilares do nosso PoC (Zelo, desafio "Saúde do Médico") que ainda depende de uma confirmação externa antes do checkpoint de 18/07.

**TL;DR**

- O fluxo de escalonamento em crise do Zelo prevê conectar o médico, mediante aceite explícito, a um psicólogo parceiro humano.
- Hoje esse parceiro ainda não está confirmado do nosso lado.
- Precisamos de uma resposta objetiva (sim/não) até **15/07/2026** para decidir se esse caminho entra na demo como conexão real ou como simulação declarada à banca.

**Contexto**

O Zelo é uma plataforma de triagem confidencial de burnout médico; quando a autoavaliação sinaliza risco agudo, o app oferece — nunca impõe — uma conexão com um psicólogo parceiro humano, preservando o anonimato em todo o resto do produto. Esse é o pilar do PoC mais diretamente ligado ao critério de "impacto social" da avaliação do edital, por lidar diretamente com risco de vida.

**O que está em aberto**

- Não há, até o momento, um psicólogo(a) ou parceiro clínico confirmado para validar os critérios de risco agudo nem para atender de fato o caminho de aceite em crise.
- Nossa PRD já previa essa possibilidade e permite que esse caminho seja simulado/mockado na demo — mas isso precisa ser uma decisão tomada com antecedência, não descoberta na última hora.

**O que isso significa para vocês**

Se a rede de parceiros da Incubintech tiver algum psicólogo(a) ou instituição disposta a apoiar esse caminho — mesmo que apenas para fins de validação do PoC — isso fortalece diretamente a nota do time no critério de impacto social. Se não houver disponibilidade a tempo, vamos apresentar o caminho como simulado, declarado explicitamente à banca, sem prejuízo para o restante da demo.

**O que precisamos de vocês**

- Confirmar até **15/07/2026** (3 dias antes do checkpoint de 18/07) se há indicação de psicólogo(a) parceiro(a) disponível para esse caminho — resposta objetiva sim/não já nos permite seguir.

Para mais contexto técnico, nossa PRD detalha o fluxo completo (aceite com token de sessão efêmero, sem persistência de identidade em texto claro; recusa com linha de crise externa, CVV 188).

Obrigado,
Equipe Zelo

---

## Notas de tradução técnico → negócio

**Traduções aplicadas**:

- "token de sessão efêmero" → mantido no e-mail apenas como referência final ("mais contexto técnico"), não no corpo principal do pedido — a mentoria não precisa do detalhe técnico para responder sim/não.
- "FR-7 a FR-10" (numeração interna da PRD) → removido do corpo do e-mail; substituído por descrição em linguagem simples do fluxo de aceite/recusa.

**Sinalizado mas mantido** (pode precisar de revisão):

- "checkpoint de 18/07" pressupõe que a mentoria já reconhece esse termo do próprio edital — mantido sem explicação adicional por ser vocabulário compartilhado com a organização da Jornada.

---

## Fontes e Referências

### Entradas primárias

- Recap relacionado: nenhum — construído a partir de `general-documentations/documentacao-produto/prd.md` (seção "Dependências": "Psicólogo(a) parceiro(a) para o caminho de aceite | Equipe / ecossistema Incubintech | Não confirmado") e `general-documentations/documentacao-produto/okrs.md` (Iniciativa 3).
- Parâmetros de audiência e CTA fornecidos pelo usuário via plano de ação priorizado (`foundation-prioritized-action-plan`, esforço P4).

### Artefatos referenciados

- `general-documentations/documentacao-produto/prd.md` — Dependências, FR-7 a FR-10
- `general-documentations/documentacao-produto/okrs.md` — Iniciativa 3
- `general-documentations/documentacao-produto/user-stories.md` — US-003, US-004

### Referências externas

- Nenhuma

### Contexto de geração

- **Gerado em**: 2026-07-11T14:00:00-03:00
- **Skill**: foundation-stakeholder-update, v1.0
- **Canal**: email
- **Variante de audiência**: customer-facing (aproximação mais próxima para stakeholder externo/parceiro institucional — não há enum específico para "mentoria de programa de aceleração")
- **Continuação de thread**: não
- **Qualidade do input**: média — não havia recap de reunião associado; construído diretamente a partir da PRD e dos OKRs, não de uma conversa registrada com a mentoria.
- **Lacunas conhecidas**: não há um nome ou canal de contato específico da mentoria no input fornecido — o time precisa endereçar este e-mail à pessoa/canal correto antes de enviar.
- **Traduções aplicadas**: 2 — ver seção acima.
