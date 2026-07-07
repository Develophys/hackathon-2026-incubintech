---
artefato: problem-statement
versão: "1.1"
criado: 2026-07-02
atualizado: 2026-07-07
status: rascunho
---

# Problem Statement: Falta de um canal confidencial de triagem e suporte à saúde mental do médico

## Resumo do Problema

Médicos em sofrimento psíquico no Brasil — e em Santa Catarina em particular — não têm hoje um canal de triagem e apoio que garanta confidencialidade real perante empregadores e conselhos profissionais. O medo de que buscar ajuda prejudique o registro no CRM ou a carreira mantém a maioria em silêncio, o que se traduz em erros clínicos evitáveis, abandono da profissão e taxas de suicídio muito acima da média da população geral.

## Impacto no Usuário

### Quem é afetado?

Médicos(as) com CRM ativo em regime de alta carga assistencial (plantonistas, emergencistas, residentes avançados) em hospitais, redes de saúde e cooperativas médicas de Santa Catarina — extensível, no futuro, a outras categorias profissionais sob risco semelhante de estigma.

### Como são afetados?

Sofrem sintomas de exaustão emocional, despersonalização e baixa realização profissional (dimensões do MBI-HSS) sem qualquer canal seguro para triagem ou apoio inicial. A alternativa disponível hoje é o silêncio ou o desabafo informal não estruturado, sem instrumento clínico validado.

### Escala do impacto

- 57% dos médicos brasileiros relatam sintomas de burnout (CFM/AMB, 2022).
- Menos de 12% buscam ajuda profissional.
- Taxa de suicídio entre médicos mais que o dobro da população geral.

*(Fontes: brief do desafio "Saúde do Médico" e pitch deck da equipe, ambos citando CFM/AMB 2022.)*

## Contexto de Negócio

### Alinhamento Estratégico

Alinhado aos objetivos da 1ª Jornada Incubintech — Método de Inovação Aberta (impacto social, viabilidade econômica, escalabilidade — edital, item 12.1) e à demanda explícita da organização demandante do desafio "Saúde do Médico".

### Impacto no Negócio

Hospitais, cooperativas e sindicatos médicos arcam com custos indiretos de rotatividade, afastamento e erro clínico evitável — custos que, segundo o pitch da equipe, superam o investimento em prevenção (mesma lógica de um seguro de responsabilidade civil).

### Por que agora?

A 1ª Jornada Incubintech impõe uma janela de 28 dias corridos (27/06/2026 a 25/07/2026) com checkpoints eliminatórios semanais, criando um incentivo concreto e datado para validar essa hipótese com um protótipo funcional (TRL3) e, em caso de bom desempenho, seguir para pré-incubação.

Há também uma janela regulatória concreta do lado do cliente pagante: a NR-1 entra em vigência fiscalizatória plena em maio de 2026, tornando obrigatória a gestão de riscos psicossociais pelos empregadores. Isso transforma a compra da ferramenta, do ponto de vista do hospital/cooperativa, de "iniciativa de bem-estar opcional" em "instrumento de conformidade legal" — reforçando o timing comercial da proposta (fonte: checklist oficial do desafio, `07_07_docs/CHECKLIST DO DESAFIO 19 – BURNOUT MÉDICO.docx`).

## Critérios de Sucesso

| Métrica | Baseline atual | Meta (fim dos 28 dias) | Prazo |
|---|---|---|---|
| Arquitetura de privacidade demonstrada (score calculado no dispositivo, nunca em texto claro no servidor) | Não existe (0%) | Demonstrada ponta a ponta no PoC | 25/07/2026 |
| Acolhimento por IA funcional (sem emissão de diagnóstico) | Não existe | Fluxo completo funcionando em demo ao vivo | 25/07/2026 |
| Matching anônimo de pares implementado | Não existe | Fluxo funcional (mesmo com dados simulados) | 25/07/2026 |
| Painel de monitoramento agregado sem exposição individual | Não existe | Protótipo navegável com métricas agregadas anonimizadas/fictícias | 25/07/2026 |
| Aprovação em checkpoints eliminatórios do edital | 0/3 | 3/3 | Semanal, até 18/07/2026 |

## Restrições & Considerações

- Prazo fixo e não negociável de 28 dias corridos, com checkpoints eliminatórios semanais (edital, item 8.4) — o não cumprimento de um checkpoint desclassifica a equipe imediatamente.
- O compartilhamento de qualquer dado do demandante fica a critério exclusivo do demandante (edital, item 10.1) — a equipe não pode presumir acesso a dados reais de pacientes/médicos.
- A LGPD (Lei nº 13.709/2018) rege qualquer dado pessoal tratado, mesmo em protótipo.
- Marco legal adicional confirmado no checklist oficial do desafio: o CID-11 reconhece burnout como fenômeno ocupacional desde 2022; a NR-1 exige gestão de riscos psicossociais pelos empregadores, com vigência fiscalizatória plena a partir de maio/2026.
- Não há, até o momento, confirmação de parceria formal com psicólogos para o escalonamento em crise — pode exigir simulação/mock documentada na demo.
- Equipe pequena de hackathon, sem validação clínica formal (comitê de ética/IRB) possível dentro do prazo — isso deve ficar explícito como próximo passo, não como algo já entregue.
- **Achado da 1ª entrevista de usuário** (Dr. David Mendes, gestor médico, 02/07/2026): médicos tendem a confiar mais em interação humana real do que em IA em momentos de sofrimento, e desconfiam de alta rotatividade de atendentes. Isso não invalida o "Acolhimento por IA" exigido pelo edital, mas exige que a IA seja humanizada e sempre acompanhada de um atalho visível para conexão humana (ver `prd.md`, FR-6b, decisão de produto de 07/07/2026).

## Perguntas em Aberto

- [ ] O desafio já tem um demandante institucional real (hospital/cooperativa) definido, ou a equipe está propondo esse ator de forma hipotética para efeito de PoC?
- [ ] Existe algum psicólogo ou parceiro clínico já disposto a validar os critérios de risco agudo (ex.: item 9 do PHQ-9) antes da final?
- [ ] Qual canal de crise externo referenciar além do CVV 188 (ex.: linha específica de apoio ao médico, se existir em Santa Catarina)?
- [ ] Dr. David Mendes se ofereceu para viabilizar entrevistas com a equipe médica que ele coordena (PS/UTI) — o time decidirá se avança com essas entrevistas antes do checkpoint de 18/07? (Responsável: Raquel Ritter, conforme anotações da entrevista de 02/07/2026)

## Fontes Adicionais (07/07/2026)

- Entrevista com Dr. David Mendes (gestor médico, PS/UTI), 02/07/2026 — `07_07_docs/Entrevista com Dr. David Mendes...docx`
- Checklist oficial do desafio 19 — Burnout Médico — `07_07_docs/CHECKLIST DO DESAFIO 19 – BURNOUT MÉDICO.docx`
- Resumo do Desafio 19 (versão revisada) — `07_07_docs/Resumo do Desafio 19 – Burnout Médico (versão revisada).docx`
