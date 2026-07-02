---
artefato: prd
versão: "1.0"
criado: 2026-07-02
status: rascunho
---

# PRD: Zelo* — Plataforma de Triagem e Suporte Confidencial à Saúde Mental do Médico

`*Nome de trabalho, ainda não validado. Ajustar em todo o pacote de documentos se o nome mudar.`

## Visão Geral

### Problem Statement (resumo)

Médicos em sofrimento psíquico não têm hoje um canal de triagem e apoio confidencial que garanta que buscar ajuda não prejudique seu registro no CRM ou sua carreira. Isso mantém a maioria em silêncio, com custo em erros clínicos evitáveis, abandono da profissão e risco de vida. (Ver documento completo: `problem-statement`.)

### Resumo da Solução

Zelo é uma PWA mobile-first que permite a um médico realizar autoavaliação clínica validada (PHQ-9, GAD-7, MBI-HSS) com score calculado inteiramente no próprio dispositivo, conversar com um chat de acolhimento por IA sem receber diagnóstico, ser conectado anonimamente a pares treinados ou, em sinal de risco agudo, receber a oferta — nunca imposição — de conexão com um psicólogo parceiro humano. O hospital ou cooperativa que financia a ferramenta enxerga apenas um painel agregado e anônimo de tendências da equipe.

### Usuários-Alvo

**Primário**: médico(a) com CRM ativo em regime de alta carga assistencial (ver Persona: Dra. Camila Andrade).
**Secundário**: gestor(a) hospitalar / coordenação de saúde ocupacional, consumidor do painel agregado (persona ainda não documentada em detalhe).

## Objetivos & Métricas de Sucesso

### Objetivos

1. Demonstrar, em protótipo funcional (TRL3), uma arquitetura de privacidade ponta a ponta que nunca expõe a identidade do médico sem consentimento ativo.
2. Validar tecnicamente o fluxo completo de acolhimento: autoavaliação → chat IA → matching de pares OU escalonamento em crise → painel agregado.
3. Chegar à final da 1ª Jornada Incubintech (25/07/2026) classificada nos 3 checkpoints eliminatórios.

### Métricas de Sucesso

| Métrica | Baseline | Meta | Prazo |
|---|---|---|---|
| Score calculado 100% client-side, sem dado bruto em texto claro no servidor | 0% (não existe) | 100% demonstrado | 25/07/2026 |
| Fluxo de chat de acolhimento funcional (sem diagnóstico) | 0% | Funcional em demo ao vivo | 25/07/2026 |
| Fluxo de escalonamento em crise (aceite e recusa) funcional | 0% | Ambos os caminhos navegáveis | 25/07/2026 |
| Aprovação em checkpoints semanais | 0/3 | 3/3 | 18/07/2026 |

### Não-Objetivos

- Não emitir diagnóstico clínico automatizado (a IA acolhe, não diagnostica).
- Não substituir terapia ou acompanhamento psiquiátrico contínuo.
- Não integrar com prontuário eletrônico hospitalar nesta fase.
- Não expor dado individual ao demandante/pagador em nenhuma circunstância fora do consentimento explícito do próprio médico.
- Não buscar validação clínica formal (comitê de ética/IRB) dentro da janela de 28 dias — fica como próximo passo pós-hackathon.

## User Stories (resumo)

| ID | User Story | Prioridade |
|---|---|---|
| US-001 | Autoavaliação com score calculado no dispositivo | P0 |
| US-002 | Chat de acolhimento por IA sem diagnóstico | P0 |
| US-003 | Escalonamento em crise — aceite de conexão humana | P0 |
| US-004 | Escalonamento em crise — recusa e linha externa | P0 |
| US-005 | Matching anônimo de pares treinados | P1 |
| US-006 | Painel agregado para gestor hospitalar | P1 |
| US-007 | Consentimento explícito antes de exposição de identidade | P0 |
| US-008 | Onboarding e transparência do modelo de privacidade | P0 |

Ver documento `user-stories` para critérios de aceite completos.

## Escopo

### Dentro do Escopo (28 dias / must-have para o PoC)

- Autoavaliação com PHQ-9, GAD-7 e/ou MBI-HSS, score calculado no dispositivo.
- Criptografia client-side (Web Crypto API, AES-256) antes de qualquer tráfego de rede.
- Chat de acolhimento por IA com system prompt de escuta ativa clínica e guardrails contra diagnóstico.
- Fluxo de decisão automática de risco agudo (regra combinando item 9 do PHQ-9 + critérios a definir com parceiro clínico).
- Caminho de aceite: token de sessão efêmero conectando a psicólogo parceiro (pode ser simulado/mockado na demo se não houver parceiro real confirmado a tempo).
- Caminho de recusa: exibição imediata de linha de crise externa (CVV 188).
- Matching anônimo de pares (pode ser versão simplificada/simulada para a demo).
- Painel de monitoramento com métricas agregadas fictícias/anonimizadas (não precisa de dado real de produção).
- PWA instalável, mobile-first.

### Fora do Escopo (28 dias)

- Validação clínica formal com comitê de ética.
- Integração com prontuário eletrônico ou sistemas hospitalares existentes.
- Múltiplos idiomas.
- App nativo (iOS/Android via lojas) — fica só PWA.
- Precificação e contrato comercial fechado com hospital pagante.

### Considerações Futuras

- Validação clínica formal e estudo piloto (6-24 meses, ciclo de pré-incubação) — adiado porque exige tempo e parceria institucional que não cabem em 28 dias.
- Expansão para outras categorias profissionais sob risco semelhante (enfermagem, outras carreiras de plantão) — adiado porque o foco do desafio é o médico.
- Multi-estado / expansão nacional — adiado, depende de tração do piloto em Santa Catarina.

## Design da Solução

### Requisitos Funcionais

#### Autoavaliação e Triagem

- **FR-1**: O sistema deve aplicar PHQ-9, GAD-7 e MBI-HSS (ou subconjunto validado com parceiro clínico) como questionário estruturado no app.
- **FR-2**: O score de cada escala deve ser calculado localmente, no dispositivo do usuário, sem envio do dado bruto de respostas ao servidor.
- **FR-3**: O sistema deve identificar automaticamente sinais de risco agudo (ex.: item 9 do PHQ-9 positivo) segundo critérios definidos com parceiro clínico.

#### Chat de Acolhimento por IA

- **FR-4**: O chat deve operar sob um system prompt de escuta ativa clínica, com guardrails explícitos contra emissão de diagnóstico.
- **FR-5**: O sistema deve anonimizar o conteúdo enviado à API de IA de terceiro antes do envio (remover identificadores diretos do texto do usuário).
- **FR-6**: O chat deve exibir aviso permanente e visível de que não substitui atendimento profissional.

#### Escalonamento em Crise

- **FR-7**: Ao identificar risco agudo, o sistema deve oferecer — nunca forçar — conexão com psicólogo parceiro humano.
- **FR-8**: Caso o médico aceite se identificar, o sistema deve gerar um token de sessão efêmero que conecta ao psicólogo, sem persistir a identidade em texto claro no banco de dados.
- **FR-9**: Caso o médico recuse, o sistema deve exibir imediatamente linhas de crise externas (ex.: CVV 188), mantendo anonimato total.
- **FR-10**: A oferta de conexão humana pode reaparecer em interações futuras, sem bloquear o uso do app caso seja recusada.

#### Matching Anônimo de Pares

- **FR-11**: O sistema deve permitir, por escolha do médico, conexão anônima com outro par treinado, sem exposição de identidade entre as partes.

#### Painel de Monitoramento

- **FR-12**: O painel deve exibir apenas métricas agregadas e anônimas (ex.: sinais de burnout por turno/setor), nunca dados vinculáveis a um indivíduo.
- **FR-13**: O sistema deve impedir, por arquitetura (não apenas por política), que o painel consiga cruzar métricas agregadas com identidade individual.

#### Privacidade & Segurança (transversal)

- **FR-14**: Toda comunicação entre dispositivo e servidor relativa a dados de saúde deve trafegar cifrada (E2E), nunca em texto claro.
- **FR-15**: O sistema deve registrar consentimento explícito e contextual antes de qualquer momento em que a identidade do médico possa ser exposta.

### Experiência do Usuário

Fluxo mobile-first (PWA): abrir app → autoavaliação (< 5 min) → score imediato no dispositivo → ramificação (fluxo padrão: chat IA → matching de pares opcional; ou fluxo de crise: oferta de conexão → aceite/recusa). Indicadores visuais de anonimato ("processado no seu aparelho", "ninguém mais vê isso") devem aparecer nos pontos de maior ansiedade do usuário — antes da autoavaliação e antes de qualquer possível exposição de identidade. Ver diagrama de referência fornecido pela equipe: "Fluxo de Acolhimento e Escalonamento em Crise" (Caminho B).

### Casos de Borda

| Cenário | Comportamento esperado |
|---|---|
| API de LLM indisponível durante o chat | Sistema informa indisponibilidade temporária e, se já houver sinal de risco identificado antes da falha, aciona diretamente o caminho de crise (linha externa) em vez de deixar o usuário sem saída |
| Nenhum par ou psicólogo disponível no momento do matching/escalonamento | Sistema comunica isso claramente e mantém a oferta de linha de crise externa sempre visível como alternativa |
| Usuário tenta reverter uma recusa de identificação anterior | Sistema permite reabrir a oferta de conexão a qualquer momento, sem penalidade ou fricção adicional |
| Conexão instável (dispositivo fica offline no meio da autoavaliação) | Progresso é preservado localmente até haver conexão para prosseguir; nenhum dado é perdido ou enviado incompleto |
| Uso simultâneo por médicos da mesma equipe (dashboard) | Painel agregado deve ter um limiar mínimo de respostas por segmento antes de exibir métricas, para evitar re-identificação por dedução (ex.: turno com um único médico) |

## Considerações Técnicas

### Restrições

- Privacy-by-design é requisito não negociável: score sempre calculado no dispositivo; servidor nunca recebe dado bruto em texto claro.
- Uso de API de LLM de terceiro (ex.: Anthropic/OpenAI) para o chat de acolhimento, com anonimização do texto antes do envio — trade-off explícito assumido para viabilizar os 28 dias (ver Perguntas em Aberto).
- Janela de 28 dias corridos com checkpoints eliminatórios semanais (edital) — qualquer requisito que não caiba nesse prazo vira "Consideração Futura".
- LGPD (Lei nº 13.709/2018) aplica-se integralmente a qualquer dado pessoal tratado, mesmo em protótipo.
- Disponibilidade de parceiro clínico (psicólogo) para o caminho de crise não está confirmada — pode exigir simulação controlada na demo, documentada como tal para a banca.

### Pontos de Integração

- **API de LLM (terceiro)**: recebe apenas texto anonimizado do chat; nunca recebe o score bruto nem identificadores diretos.
- **Web Crypto API (client-side)**: cálculo de score e cifragem AES-256 antes de qualquer envio de rede.
- **Canal de tempo real** (detalhado no documento de arquitetura técnica): conexão ao vivo médico-psicólogo no caminho de crise, via token de sessão efêmero.
- **Banco de dados de métricas agregadas**: recebe apenas ciphertext/dados anonimizados, nunca texto claro identificável.

### Requisitos de Dados

Dado bruto de autoavaliação nunca sai do dispositivo em texto claro. Apenas ciphertext (quando aplicável) e métricas agregadas anonimizadas chegam ao servidor. A identidade do médico só é persistida, de forma efêmera e por consentimento explícito, no canal de conexão com o psicólogo durante um episódio de crise aceito — nunca em texto claro no banco principal.

## Dependências & Riscos

### Dependências

| Dependência | Responsável | Status | Impacto se atrasar |
|---|---|---|---|
| Parceiro clínico para validar critérios de risco agudo e escalas | Equipe / mentoria da Jornada | Não confirmado | Sem critério clínico validado, o escalonamento de crise vira uma regra hipotética não defensável perante a banca |
| Psicólogo(a) parceiro(a) para o caminho de aceite | Equipe / ecossistema Incubintech | Não confirmado | Caminho de aceite precisa ser simulado/mockado na demo, com isso declarado explicitamente |
| Escolha final do provedor de LLM | Equipe técnica | Em aberto | Sem decisão, o chat de acolhimento não pode ser implementado |

### Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| IA do chat emitir algo interpretável como diagnóstico | Média | Alto | System prompt com guardrails explícitos + revisão humana do prompt por mentor especializado + disclaimers visíveis |
| Não atingir TRL3 dentro dos 28 dias | Média | Alto | Priorizar rigorosamente o "Dentro do Escopo" desta PRD; simular partes dependentes de terceiros |
| Dado anonimizado enviado à API de LLM ainda permitir re-identificação indireta | Baixa/Média | Alto (viola a proposta central de privacidade) | Checklist de anonimização antes do envio; revisão específica desse ponto em cada checkpoint |
| Reprovação em checkpoint eliminatório por atraso de entrega | Média | Alto (eliminação, edital item 8.4) | Cronograma interno com folga antes de cada data de checkpoint do edital |

## Cronograma & Marcos

| Marco | Descrição | Data alvo |
|---|---|---|
| Lançamento da Jornada | Escolha do desafio, formação da equipe | 27/06/2026 |
| Checkpoint 1 | Entender + início do Desenvolver (fases 1-2 do Método Incubintech) | ~04/07/2026 (semanal, a confirmar) |
| Checkpoint 2 | Desenvolver avançado + início de Validar | ~11/07/2026 (a confirmar) |
| Checkpoint 3 | Validar + Refinar | ~18/07/2026 (a confirmar) |
| Final e Feira de Projetos | Demo ao vivo do PoC (TRL3), pitch de até 4 min | 25/07/2026 |

*Nota: o edital define os checkpoints como semanais ao longo dos 28 dias, mas não publica as datas exatas de cada um nas informações disponíveis. As datas acima são uma estimativa de planejamento interno e devem ser confirmadas com o cronograma oficial divulgado pela organização.*

## Perguntas em Aberto

- [ ] Qual provedor de LLM será usado para o chat de acolhimento, e qual sua política de retenção de dados para as chamadas de API? — Responsável: Tech Lead
- [ ] Existe parceiro clínico (psicólogo) confirmado para validar os critérios de risco agudo antes da final? — Responsável: Líder de equipe
- [ ] O painel institucional terá uma persona "gestor hospitalar" documentada, ou fica fora do escopo de PM por ora? — Responsável: PM
- [ ] Qual o limiar mínimo de respostas por segmento no painel agregado para evitar re-identificação por dedução? — Responsável: Tech Lead + PM

## Apêndice

### Documentos Relacionados

- Problem Statement — `problem-statement.docx` (mesmo pacote de entrega)
- Persona — `persona.docx` (mesmo pacote de entrega)
- Lean Canvas — `lean-canvas.docx` (mesmo pacote de entrega)
- OKRs — `okrs.docx` (mesmo pacote de entrega)
- User Stories — `user-stories.docx` (mesmo pacote de entrega)
- Fluxo de Acolhimento e Escalonamento em Crise (`fluxo-escalonamento-crise.pdf`, fornecido pela equipe)
- Pitch Deck (`pitch-deck.pdf`, fornecido pela equipe)
- Edital 1ª Jornada Incubintech (`EDITAL-Incubintech_1a-Jornada.pdf`)

### Histórico de Revisões

| Versão | Data | Autor | Mudanças |
|---|---|---|---|
| 1.0 | 2026-07-02 | Rascunho gerado via pm-skills a partir do edital, brief, pitch deck e fluxo de crise fornecidos; revisão da equipe pendente | Versão inicial |
