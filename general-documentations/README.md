---
artefato: readme-indice
versão: "1.0"
criado: 2026-07-11
status: rascunho
---

# Zelo* — Índice de Documentação

`*Nome de trabalho, ainda não validado.`

Este arquivo existe para uma pessoa (nova no time, mentor da Jornada, ou você mesmo depois de
alguns dias fora) conseguir se situar rapidamente: o que é o problema, o que já foi decidido, o
que está planejado e o que ainda está pendente. Leia na ordem abaixo — cada fase constrói sobre
a anterior.

## Fase 0 — Visão geral rápida (5 min, se só der pra ler uma coisa)

1. [`roadmap/README.md`](roadmap/README.md) — a tabela "Rodada de decisões" é o retrato mais
   atual do estado do projeto: o que foi decidido, onde está documentado, e o que ainda está
   pendente.

## Fase 1 — O problema e por que agora

2. [`documentacao-produto/problem-statement.md`](documentacao-produto/problem-statement.md) — o
   problema, a urgência, o prazo dos 28 dias, o gatilho regulatório (NR-1). Base de tudo o resto.
3. [`documentacao-produto/persona.md`](documentacao-produto/persona.md) — quem é o usuário final
   (Dra. Camila Andrade) e por que ela não confia em nada institucional hoje.
4. [`documentacao-produto/persona-gestor-hospitalar.md`](documentacao-produto/persona-gestor-hospitalar.md)
   — quem paga e usa o painel institucional (Dra. Beatriz Konder) — persona secundária, ainda
   Proto (sem entrevista direta).

## Fase 2 — O modelo de negócio e o mercado

5. [`documentacao-produto/lean-canvas.md`](documentacao-produto/lean-canvas.md) — a tese de
   negócio completa: problema, segmento, proposta de valor, preço, canais.
6. [`documentacao-produto/competitive-analysis.md`](documentacao-produto/competitive-analysis.md)
   — quem mais resolve pedaços desse problema e onde está o espaço vazio.
7. [`documentacao-produto/differentiation-traceability.md`](documentacao-produto/differentiation-traceability.md)
   — liga cada diferencial competitivo a uma FR/US concreta do produto, para não virar só
   discurso de pitch.

## Fase 3 — O produto em si (o núcleo)

8. [`documentacao-produto/prd.md`](documentacao-produto/prd.md) — o documento central:
   requisitos funcionais, escopo, dependências, riscos, perguntas em aberto. Praticamente tudo
   nesta pasta remete a ele.
9. [`documentacao-produto/user-stories.md`](documentacao-produto/user-stories.md) — as 8
   histórias com critérios de aceite, aprofundando cada requisito funcional da PRD.
10. [`documentacao-produto/adr-001-fr16-nr1-painel-gestor.md`](documentacao-produto/adr-001-fr16-nr1-painel-gestor.md)
    — decisão específica sobre o enquadramento de conformidade NR-1 no painel do gestor
    (contexto, opções consideradas, consequências).
11. [`../docs/superpowers/specs/privacy-architecture-diagram.md`](../docs/superpowers/specs/privacy-architecture-diagram.md)
    — o diagrama que prova, tecnicamente, a promessa central de privacidade do produto.

## Fase 4 — Execução: quem faz o quê, e o que falta

12. [`documentacao-produto/okrs.md`](documentacao-produto/okrs.md) — objetivo do ciclo,
    resultados-chave, guardrails de integridade.
13. Roadmaps individuais — tarefas por pessoa, semana a semana:
    [`roadmap/mauricio.md`](roadmap/mauricio.md) ·
    [`roadmap/raquel-ritter.md`](roadmap/raquel-ritter.md) ·
    [`roadmap/kati.md`](roadmap/kati.md) ·
    [`roadmap/yasmin.md`](roadmap/yasmin.md)
14. [`documentacao-produto/roteiro-entrevista-psicologos-parceiros.md`](documentacao-produto/roteiro-entrevista-psicologos-parceiros.md)
    — o trabalho pendente mais importante agora: valida os critérios clínicos ainda em aberto
    (risco agudo, escalas, protocolo de escalonamento).
15. [`documentacao-produto/2026-07-11_stakeholder-update-email-mentoria-parceiro-psicologo.md`](documentacao-produto/2026-07-11_stakeholder-update-email-mentoria-parceiro-psicologo.md)
    — e-mail pronto para a mentoria da Jornada, ainda não enviado (falta só o destinatário real).

## Fase 5 — Deep dive técnico (opcional, se for engenharia)

16. [`../docs/superpowers/specs/`](../docs/superpowers/specs/) — telas, tokens de design,
    arquitetura da PWA.
17. [`../docs/superpowers/plans/`](../docs/superpowers/plans/) — planos de implementação por
    vertical (fundação, backend, frontend, chat de IA, avaliação, etc.).

---

## Como manter este índice atualizado

- Sempre que um novo documento de produto for criado em `documentacao-produto/`, adicione uma
  linha na fase correspondente (não deixe um documento "órfão", sem link daqui).
- Sempre que uma pergunta em aberto for resolvida em algum documento, isso já deve aparecer na
  tabela "Rodada de decisões" de `roadmap/README.md` — este índice não duplica esse conteúdo,
  só aponta o caminho de leitura.
- Revisar esta ordem a cada checkpoint semanal da Jornada, caso a estrutura de pastas mude.
