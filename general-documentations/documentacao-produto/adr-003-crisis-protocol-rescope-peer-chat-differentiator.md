---
artefato: adr
versão: "1.0"
criado: 2026-07-19
atualizado: 2026-07-19
status: aceito
---

# ADR-003: Simplificação do protocolo de crise (FR-7–FR-10) e preservação deliberada do chat anônimo entre pares (FR-6b) como diferencial

## Status

**Aceito** em 19/07/2026, por Mauricio (coordenação de escopo do produto).

**Data:** 2026-07-19
**Decisores:** Mauricio (coordenação de escopo).

## Contexto

Faltam 6 dias corridos para a Final e Feira de Projetos (25/07/2026); o Checkpoint 3 (18/07) já passou. Mauricio segue como único responsável técnico (dev full stack + arquitetura + DevOps), acumulando as tarefas herdadas de Gui (ver `roadmap/README.md`).

Em 19/07/2026, a ACM respondeu formalmente às perguntas do time (`general-documentations/Perguntas encaminhadas a ACM.pdf`, Dr. Marcello Alberton Herdt, Diretor de Inovação — ACM). Sobre o protocolo de crise (pergunta 1.2), a resposta foi:

> "a solução deve realizar a devida comunicação para os canais de serviços de emergência já existentes, com direcionamento diferenciado conforme o vínculo do profissional — rede SUS ou plano de saúde/rede privada. Não é esperada integração técnica direta com esses serviços nesta fase; o essencial é o direcionamento correto e imediato."

Hoje, FR-7 a FR-10 (`prd.md`) e US-003/US-004 (`user-stories.md`) descrevem uma arquitetura mais pesada do que isso: conexão **ao vivo** entre médico e psicólogo, via token de sessão efêmero, sobre um **canal cifrado de ponta a ponta** dedicado — ainda uma tarefa aberta em `roadmap/mauricio.md` (Semana 2): "Configurar o canal cifrado de ponta a ponta usado na conexão ao vivo médico–psicólogo (token de sessão efêmero) no caminho de crise." Com a confirmação da ACM de que integração técnica direta não é esperada, essa tarefa consome capacidade de engenharia solo em algo que deixou de ser o mínimo exigido.

Ao mesmo tempo, a resposta 1.4 da ACM sobre "apoio entre pares" — que fala em direcionamento a canais profissionais curados (psicoterapia via SUS/rede privada/programas empresariais), não em matching peer-to-peer entre médicos — trouxe o risco de se interpretar, por extensão, que **todo** o conceito de conexão anônima entre pares deveria ser cortado do produto. Essa não é a mesma decisão. O atalho "falar com uma pessoa real" dentro do chat de acolhimento por IA (`prd.md` FR-6b; `user-stories.md` US-002, AC-4) — que oferece escolha explícita entre par médico treinado **ou** psicólogo — não nasceu de um pedido da ACM. Nasceu da entrevista com o Dr. David Mendes (gestor médico, 02/07/2026), registrada na própria PRD como nota de refinamento de 07/07/2026: o médico entrevistado afirmou que desconfiaria "no menor sinal" de estar falando com uma IA em vez de uma pessoa real, e abandonaria a conversa. FR-6b já é P0 no backlog e majoritariamente implementado (`roadmap/mauricio.md`, Semana 1). Cortá-lo agora eliminaria a resposta do produto à barreira de adoção mais concretamente validada que o time tem — trocando uma decisão embasada em pesquisa primária por uma leitura indireta de uma resposta da ACM que trata de um assunto diferente (curadoria de encaminhamento profissional, não o design do chat de acolhimento).

**Forças em jogo:**
- **A favor de simplificar FR-7–FR-10:** libera dias reais de um dev solo, no prazo mais apertado do projeto até agora; a própria ACM descreve o mínimo esperado com clareza (citação acima); o critério de avaliação da PoC (resposta 4.1 da ACM) é a robustez do fluxo triagem → direcionamento → follow-up, não a existência de um canal cifrado ao vivo.
- **A favor de preservar FR-6b:** é evidência de pesquisa primária com usuário real, não hipótese; já é P0 e já está majoritariamente construído — cortá-lo não economiza tempo relevante, e reverteria uma decisão de produto já validada; nenhuma resposta da ACM pede a remoção dessa funcionalidade especificamente.
- **Contra tratar isso como uma decisão só:** misturar as duas questões (simplificar o canal técnico de crise vs. manter o atalho humano no chat) sob a mesma leitura da resposta 1.4 da ACM criaria um corte de escopo não pedido por ninguém e desalinhado com a própria PRD.

## Decisão

Esta ADR toma duas decisões distintas, deliberadamente separadas para não serem confundidas em revisões futuras.

**Parte 1 — Simplificação do protocolo de crise (FR-7–FR-10).** FR-7 a FR-10 da `prd.md` passam de "conexão ao vivo médico-psicólogo via token de sessão efêmero sobre canal cifrado de ponta a ponta dedicado" para: **sinalização de risco agudo + direcionamento diferenciado e imediato conforme o vínculo do profissional (rede SUS vs. plano de saúde/rede privada)**, sem construção de um canal ao vivo cifrado dedicado nesta janela de 28 dias. A oferta de conexão humana (FR-7), o caminho de recusa com linha externa (FR-9, ex. CVV 188) e o registro de consentimento (FR-15) permanecem inalterados — só a camada de transporte "ao vivo" é removida do escopo técnico. A tarefa "Configurar o canal cifrado de ponta a ponta [...] no caminho de crise" em `roadmap/mauricio.md` (Semana 2) fica marcada como superada por esta ADR.

**Parte 2 — Preservação do chat anônimo entre pares como diferencial (FR-6b, US-002 AC-4).** FR-6b e a capacidade técnica subjacente de conexão anônima ponto-a-ponto entre duas pessoas **permanecem integralmente no escopo**, sem redução de prioridade (seguem P0). Isso é explicitamente **não** uma resposta a um pedido da ACM — é uma decisão de produto mantida por conta própria, com a mesma lógica de custo-benefício já usada em ADR-001: evidência real (entrevista com usuário primário) + custo de implementação já baixo (majoritariamente pronto) = diferencial que vale manter mesmo fora do que foi pedido pelo demandante.

**Critério de corte objetivo, para uso em qualquer decisão futura de escopo nos próximos 6 dias:** um diferencial (como FR-6b) só é preservado enquanto **não** ameaçar o prazo do fluxo obrigatório confirmado pela ACM (triagem GAD-2/PHQ-2 → direcionamento → follow-up — este último ainda por construir, ver plano de ação de 19/07/2026). Se a construção do follow-up atrasar, o primeiro item a ser cortado é qualquer polimento **adicional** em US-005 (matching de pares standalone, hoje P1, já simulado com perfis fictícios) — nunca o atalho FR-6b em si, que é P0, já majoritariamente implementado, e distinto de US-005 (FR-6b é o atalho dentro do chat de IA; US-005 é a funcionalidade separada e opcional de buscar um par depois do chat).

**O que fica fora desta decisão (explicitamente excluído):**
- Qualquer redução de prioridade, remoção ou "modo simulado apenas" para FR-6b/US-002 AC-4 — isso não está sendo decidido aqui, e não deve ser inferido a partir da resposta 1.4 da ACM em revisões futuras.
- Qualquer remoção do caminho de recusa com linha externa (FR-9) ou do registro de consentimento (FR-15) — inalterados.
- Qualquer novo desenvolvimento de integração técnica real com serviços de emergência (SAMU, CVV, sistemas de plano de saúde) — permanece fora de escopo, como já registrado em `prd.md`, "Fora do Escopo".

## Consequências

### Positivas

- Libera capacidade real de um dev solo em um prazo de 6 dias, exatamente no ponto de maior custo técnico do backlog atual (canal cifrado de ponta a ponta), redirecionável para o gap crítico já identificado (mecanismo de follow-up).
- Evita um corte de escopo não solicitado e potencialmente prejudicial: sem esta ADR, a leitura apressada da resposta 1.4 da ACM poderia levar à remoção de uma funcionalidade validada por pesquisa primária (FR-6b), que é hoje uma das poucas decisões de produto com evidência direta de entrevista.
- Dá ao time um critério de corte explícito e reutilizável (diferencial vs. escopo obrigatório) para as próximas decisões de priorização até 25/07, em vez de decidir caso a caso sob pressão de prazo.

### Negativas

- FR-7–FR-10 simplificados tornam o produto tecnicamente menos ambicioso na conexão de crise do que a arquitetura originalmente desenhada (token efêmero + canal cifrado dedicado) — isso precisa ser comunicado com clareza no pitch como uma decisão deliberada de escopo, não como uma limitação não percebida, para não parecer recuo perante a banca.
- Mantém uma dependência de tempo em algo (FR-6b) que não é exigido pela ACM; se o prazo apertar mais do que o previsto, a tentação de cortar FR-6b para "ganhar tempo rápido" existe — o critério de corte desta ADR existe justamente para resistir a essa tentação de forma consciente, não para eliminá-la.

### Neutras

- Não exige nenhuma mudança na arquitetura de privacidade já decidida (anonimização, consentimento contextual) — a simplificação de FR-7–FR-10 remove uma camada de transporte "ao vivo", não os princípios de privacidade que já se aplicavam a ela.
- Se, após 25/07, a ACM ou um parceiro operacional confirmar um canal real de conexão ao vivo com psicólogo, essa arquitetura pode ser retomada como evolução pós-hackathon, sem invalidar a decisão tomada aqui para a janela de 28 dias.

## Alternativas Consideradas

### Opção A — Manter FR-7–FR-10 como estavam (canal cifrado ao vivo completo)

Continuar construindo a conexão ao vivo médico-psicólogo com token de sessão efêmero e canal cifrado dedicado, ignorando a simplificação sinalizada pela ACM.

**Por que não foi escolhida:** consome dias de um dev solo em algo que o próprio demandante disse não ser esperado nesta fase (resposta 1.2), no exato momento em que um gap crítico e evidenciado (follow-up, resposta 4.1) ainda não tem nenhuma linha de código ou user story. O custo de oportunidade é alto demais a 6 dias da final.

### Opção B — Cortar FR-6b/US-002 AC-4 junto com a simplificação de FR-7–FR-10

Interpretar a resposta 1.4 da ACM (apoio entre pares = direcionamento a canais profissionais curados) como sinal para remover ou rebaixar de prioridade todo o conceito de conexão anônima entre pessoas, incluindo o atalho do chat de IA.

**Por que não foi escolhida:** confunde duas perguntas diferentes. A resposta 1.4 fala sobre curadoria de encaminhamento para apoio profissional em casos de risco leve/moderado — não sobre o design do chat de acolhimento por IA nem sobre a barreira de confiança em IA identificada na entrevista com Dr. David Mendes. FR-6b já é P0, já majoritariamente implementado, e sua remoção não devolveria tempo de engenharia relevante — apenas reverteria uma decisão de produto validada por pesquisa primária, sem nenhum pedido correspondente da ACM para isso.

### Opção C — Não decidir nada agora, revisar escopo apenas no fim da Semana 3

Adiar qualquer decisão de re-escopo até os últimos dias antes da final, avaliando tudo junto na preparação do pitch.

**Por que não foi escolhida:** a tarefa do canal cifrado (`roadmap/mauricio.md`) continuaria aberta e sendo trabalhada por inércia nos próximos dias, desperdiçando exatamente a janela de tempo que esta ADR pretende liberar — o mesmo risco já identificado no plano de ação de 19/07/2026 (Seção 6, "Time continua trabalhando no canal cifrado ao vivo por hábito/inércia antes de aplicar a ADR").

## Referências

- `general-documentations/Perguntas encaminhadas a ACM.pdf` — respostas 1.2 (protocolo de crise) e 1.4 (apoio entre pares), Dr. Marcello Alberton Herdt, 19/07/2026
- `general-documentations/documentacao-produto/prd.md` — FR-6b (nota de refinamento 07/07/2026, entrevista Dr. David Mendes), FR-7 a FR-11
- `general-documentations/documentacao-produto/user-stories.md` — US-002 (AC-4), US-003, US-004, US-005
- `general-documentations/roadmap/mauricio.md` — Semana 2, tarefa do canal cifrado de ponta a ponta (superada por esta ADR)
- `general-documentations/documentacao-produto/adr-001-fr16-nr1-painel-gestor.md` — padrão de formato e de raciocínio "diferencial honesto, custo baixo, evidência real vale manter mesmo fora do pedido do demandante"
- `general-documentations/documentacao-produto/adr-002-mbi-hss-direction.md` — padrão de formato e de rastreabilidade de decisão
- `general-documentations/documentacao-produto/2026-07-19-action-plan-respostas-acm.md` — plano de ação priorizado que originou esta ADR (Seção 5, Esforço P1)
