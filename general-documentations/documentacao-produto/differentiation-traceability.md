---
artefato: differentiation-traceability
versão: "1.0"
criado: 2026-07-11
atualizado: 2026-07-11
status: rascunho
---

# Rastreabilidade de Diferenciação Competitiva: Zelo

## Propósito

Manter um elo direto e verificável entre os diferenciais identificados em `competitive-analysis.md` e onde eles realmente existem no produto (FR na PRD, critério de aceite em uma user story, ou elemento de tela). Sem isso, um diferencial vira só uma frase de pitch — com isso, qualquer pessoa do time (ou a banca da Jornada) consegue apontar exatamente onde no produto a alegação é verdadeira.

**Regra de uso**: só marcar "Coberto" quando existir uma referência concreta (ID de FR, ID de US/AC, ou arquivo de tela). Se a referência não existir ainda, o status é "Ausente" ou "Parcial" — nunca marcar como coberto por intenção.

## Como manter atualizado

- Revisar esta tabela a cada checkpoint semanal da Jornada, junto com `competitive-analysis.md`.
- Atualizar sempre que uma FR, US ou tela nova for adicionada ou alterada na PRD/specs.
- Atualizar sempre que a análise competitiva for revisada (novo concorrente, novo movimento de mercado).
- **Owner**: a definir pelo time (mesma pendência de liderança de produto registrada em `prd.md`, "Perguntas em Aberto").

## Tabela de Rastreabilidade

| Diferencial competitivo | Concorrente(s) que não têm isso | Onde está no produto | Status |
|---|---|---|---|
| Arquitetura de privacidade verificável (score calculado no dispositivo, nunca texto claro no servidor) | Physicians Anonymous, VITAL WorkLife, Zenklub — confidencialidade só procedural/política, não técnica | FR-2, FR-14 (`prd.md`); US-001 AC-1/AC-3 (`user-stories.md`); `02-privacy.md`; `08-onboarding-consent-screens.md` | Coberto |
| Atalho humano sempre visível dentro do chat de IA (não só quando o sistema detecta risco agudo) | Wysa (só IA, sem par humano), Physicians Anonymous (só humano, sem IA) | FR-6b (`prd.md`); US-002 AC-4 (`user-stories.md`); `11-chat.md` | Coberto |
| Consentimento contextual e específico antes de qualquer exposição de identidade | Nenhum concorrente analisado documenta isso explicitamente como mecanismo de produto | FR-15 (`prd.md`); US-007 (`user-stories.md`) | Coberto |
| Painel agregado com garantia de não re-identificação (limiar mínimo por segmento) | Zenklub, Wysa — relatórios enterprise não documentam k-anonimato como regra de produto | FR-12, FR-13 (`prd.md`); US-006 AC-2 (`user-stories.md`); `13-manager.md` (regra `n >= 5`) | Coberto |
| Foco específico no medo do médico (registro no CRM/CFM), não bem-estar corporativo genérico | Wysa, Zenklub, NR Guard — todos genéricos, nenhum endereça o conselho profissional | Persona Dra. Camila Andrade (`persona.md`); copy de `02-privacy.md` ("nem o seu CRM") | Coberto |
| Painel agregado empacotado como artefato de conformidade NR-1 (PGR/GRO), não só "tendência de equipe" | NR Guard, Solides, Moodar (fazem só compliance, zero cuidado individual); VITAL WorkLife (faz relatório de governança, mas não é NR-1/Brasil) | — nenhuma FR/US/tela atual cobre isso | **Ausente — ver gap prioritário abaixo** |
| Precificação testada e competitiva frente ao benchmark local (Zenklub ~R$22–25/vida/mês) | Zenklub (preço público conhecido no Brasil) | `lean-canvas.md` marca preço como "a definir" | Pendente — gap de validação comercial, não de produto |

## Gap Prioritário: Enquadramento de Conformidade NR-1 no Painel do Gestor

**Por que importa**: é a recomendação estratégica de maior valor da análise competitiva (`competitive-analysis.md`, seção "Onde diferenciar", item 3) e o argumento comercial mais forte para transformar a compra do Zelo de "bem-estar opcional" em "instrumento de conformidade legal" (`problem-statement.md`, "Por que agora?"). Hoje, FR-12/FR-13 e US-006 descrevem o painel apenas como visão de tendências de burnout — sem nenhuma linguagem ou estrutura de dado que uma equipe de SST/RH reconheceria como evidência de gestão de risco psicossocial para a NR-1.

**Proposta concreta (a validar com o time antes de virar FR formal na PRD):**

- **Nova FR candidata (FR-16)**: o painel agregado deve apresentar os dados também em formato que mapeie aos fatores de risco psicossocial do PGR (ex.: sobrecarga, jornada, indicadores por setor/turno), permitindo leitura/exportação como evidência de gestão de risco psicossocial — sempre herdando as restrições de anonimato de FR-13 (nunca dado individual).
- **Novo critério de aceite em US-006**: "Dado que o gestor acessa o painel, quando ele visualiza as métricas, então elas aparecem rotuladas de forma reconhecível como fatores de risco psicossocial mapeáveis ao PGR (não apenas 'tendências'), com uma exportação simples (PDF/CSV) para o dossiê de compliance do RH."
- **Impacto em tela**: `13-manager.md` ganharia uma seção "resumo para compliance NR-1" e/ou botão de exportação — mudança de conteúdo/copy sobre dado que já existe (agregado, anonimizado), não uma mudança de arquitetura.
- **Risco/dependência**: exige confirmar com um parceiro jurídico ou de SST (mentoria da Jornada?) qual estrutura de dado é de fato aceita como evidência de PGR — o objetivo é não fabricar um formato que pareça compliance sem sê-lo.

**Decisão pendente**: o time precisa decidir se isso entra no escopo dos 28 dias (aumenta o escopo do painel, hoje P1) ou fica registrado como "Consideração Futura" na PRD, citando esta análise como justificativa. Ver `prd.md`, seção "Considerações Futuras", e adicionar a decisão lá quando tomada.

## Próxima revisão

Revisar junto ao checkpoint semanal da Jornada (próximo: 18/07/2026), e imediatamente após qualquer mudança em `competitive-analysis.md` ou em FR/US/telas relacionadas às linhas desta tabela.
