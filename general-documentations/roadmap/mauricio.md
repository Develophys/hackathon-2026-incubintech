# Roadmap — Mauricio Alexandre (Desenvolvedor full stack / Arquiteto de software)

> Ver `README.md` para a linha do tempo completa e as decisões de produto que embasam estas tarefas.

## Semana 1 — até 11/07/2026 (Checkpoint 2, foco Fase 2)

- [ ] Implementar autoavaliação (PHQ-9, GAD-7, MBI-HSS) com cálculo de score 100% client-side na PWA — nenhum dado bruto em texto claro sai do dispositivo (PRD FR-1, FR-2).
- [ ] Implementar cifragem client-side (Web Crypto API, AES-256) antes de qualquer envio de rede (PRD FR-14).
- [ ] Integrar o chat de acolhimento por IA (provedor de LLM a definir com o time) com anonimização client-side do texto antes do envio (PRD FR-4, FR-5).
- [ ] Implementar o atalho permanente e visível "falar com uma pessoa real" dentro do chat de IA — decisão de produto de 07/07/2026 (PRD FR-6b, user-stories US-002 AC-4).
- [ ] Implementar a identificação automática de sinais de risco agudo (ex.: item 9 do PHQ-9) segundo critério a validar com parceiro clínico (PRD FR-3).
- [ ] Preparar evidência técnica, para o checkpoint, de que nenhuma resposta sensível é retida sem consentimento explícito.

## Semana 2 — 12/07 a 18/07/2026 (Checkpoint 3, foco Fase 3)

- [ ] Implementar o fluxo de escalonamento em crise: aceite (token de sessão efêmero, identidade não persistida em texto claro) e recusa (exibição imediata de linha externa, ex. CVV 188) — PRD FR-7 a FR-10.
- [ ] Implementar matching anônimo de pares (pode usar dados simulados, desde que documentado como tal) — PRD FR-11.
- [ ] Implementar tela de crise e o painel de monitoramento longitudinal local (gráfico de evolução pessoal).
- [ ] Trabalhar com Gui no diagrama de fluxo de dados / arquitetura de privacidade (entregável obrigatório do checklist).
- [ ] Registrar consentimento explícito e contextual antes de qualquer momento de possível exposição de identidade (PRD FR-15).

## Semana 3 — 19/07 a 25/07/2026 (Fase 4 + preparação final)

- [ ] Implementar a biblioteca de conteúdo (com curadoria de temas feita por Raquel).
- [ ] Ajustes finais de UX e performance para a demo ao vivo — funcionamento offline-first, mobile, autoavaliação em menos de 5 minutos.
- [ ] Testar o painel institucional com o limiar mínimo por segmento (n) definido por Kati, para evitar re-identificação por dedução.
- [ ] Preparar o ambiente e o roteiro técnico da demo ao vivo (TRL3) junto com Gui.

## Pendências que dependem de decisão do time

- Provedor de LLM e política de retenção de dados da API (PRD, Perguntas em Aberto).
- Texto e posicionamento exato do atalho humano (FR-6b) — junto com Raquel para o copy.
