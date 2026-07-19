---
artefato: prioritized-action-plan
versão: "1.0"
criado: 2026-07-19
status: rascunho
---

# Plano de Ação Priorizado — Respostas da ACM (19/07/2026)

`Gerado via pm-skill foundation-prioritized-action-plan a partir de "Perguntas encaminhadas a ACM.pdf" e da documentação de produto existente (prd.md, adr-001, adr-002, user-stories.md, roadmap/).`

---

## Step 0: Source ledger

```
S1: "a solução deve realizar a devida comunicação para os canais de serviços de emergência já existentes, com direcionamento diferenciado conforme o vínculo do profissional — rede SUS ou plano de saúde/rede privada. Não é esperada integração técnica direta com esses serviços nesta fase; o essencial é o direcionamento correto e imediato." (origin: general-documentations/Perguntas encaminhadas a ACM.pdf, resposta 1.2)
S2: "recomendamos o uso do GAD-2 e do PHQ-2 como primeiro filtro — dois questionários validados, de apenas duas perguntas cada, para rastreio de ansiedade e depressão, respectivamente. [...] Em caso de positivos (pontuação maior igual a 3) abrem os questionários ampliados: Gad 7 e PHQ9 para uma triagem mais aprofundada, para melhor direcionamento." (origin: Perguntas encaminhadas a ACM.pdf, resposta 1.3)
S3: "para risco leve e moderado, a expectativa é uma comunicação específica com canais de apoio — serviços de psicoterapia disponíveis via SUS, rede privada e programas empresariais. A curadoria dos especialistas para essa conexão poderá ser feita também por mim Dr. Marcello Alberton neste momento inicial" (origin: Perguntas encaminhadas a ACM.pdf, resposta 1.4)
S4: "os KPIs prioritários para esta fase são, essencialmente, o número de questionários respondidos e a taxa de resposta da pesquisa de seguimento (follow-up)" (origin: Perguntas encaminhadas a ACM.pdf, resposta 2.1)
S5: "Para o hackathon, o foco deve contemplar o ciclo completo em profundidade: triagem (GAD-2/PHQ-2), direcionamento assertivo (para o canal certo, conforme risco e vínculo SUS/privado) e acompanhamento (follow-up). Não é necessário desenvolver os quatro formulários mencionados na documentação original — o critério de avaliação está na robustez desse fluxo de triagem → direcionamento → follow-up." (origin: Perguntas encaminhadas a ACM.pdf, resposta 4.1)
S6: "empresas de outros setores têm endereçado esse problema ampliando a disponibilidade de acesso à saúde mental para colaboradores por meio de plataformas como a Zenklub (Psicologia Viva), facilitando o acesso a profissionais de saúde mental" (origin: Perguntas encaminhadas a ACM.pdf, resposta 3.2)
S7: "ainda não temos essa informação estruturada — o serviço em si ainda não existe. [...] como comunicar acolhimento em um serviço novo, sem histórico de confiança já construído." (origin: Perguntas encaminhadas a ACM.pdf, resposta 2.3)
S8: "Enviar email para: hudsonsilva@acm.org.br" / "Com cópia para: preincubadora.fln@ifsc.edu.br" (origin: Perguntas encaminhadas a ACM.pdf, "Outros Esclarecimentos e Perguntas Reservadas")
S9: "Caso o médico aceite se identificar, o sistema deve gerar um token de sessão efêmero que conecta ao psicólogo, sem persistir a identidade em texto claro no banco de dados." (origin: documentacao-produto/prd.md, FR-8)
S10: "O sistema deve permitir, por escolha do médico, conexão anônima com outro par treinado, sem exposição de identidade entre as partes." (origin: documentacao-produto/prd.md, FR-11)
S11: "Configurar o canal cifrado de ponta a ponta usado na conexão ao vivo médico–psicólogo (token de sessão efêmero) no caminho de crise." (origin: roadmap/mauricio.md, Semana 2, tarefa aberta)
S12: "Gui (DevOps) saiu do time. Mauricio confirmou que assume integralmente o papel de DevOps, além de desenvolvedor full stack/arquiteto" (origin: roadmap/README.md)
S13: "Final e Feira de Projetos | Demo ao vivo do PoC (TRL3), pitch de até 4 min | 25/07/2026" (origin: documentacao-produto/prd.md, Cronograma & Marcos)
```

---

## Seção 0. Sumário Executivo

- **Classificação da situação:** Complicada (Cynefin) — a relação causa-efeito é conhecida (basta análise e boa prática de produto para decidir o que fazer); não há crise nem imprevisibilidade genuína.
- **Restrição vinculante:** capacidade de engenharia solo (Mauricio, dev + DevOps) fixa em 6 dias corridos até a final (25/07), no momento exato em que a ACM simplifica parte do escopo já em construção (S1, S3) mas confirma um requisito de acompanhamento ("follow-up") ainda inexistente no backlog (S4, S5).
- **Esforço crítico (P1):** registrar uma ADR que re-escopa formalmente FR-7–FR-10 e despriorize o polimento de matching de pares, liberando capacidade solo para o gap confirmado de follow-up.
- **Confiança geral do plano:** Média-Alta — as próprias palavras da ACM (S1, S3, S5) resolvem a maior parte da ambiguidade; a incerteza residual é sobre detalhes operacionais de roteamento e sobre o quanto a banca de fato valoriza funcionalidades bônus como o matching de pares.
- **Tempo até o primeiro valor:** a ADR (P1) pode ser escrita ainda hoje (19/07); a construção do follow-up (P2) e a atualização de PRD/user-stories/roadmap (P3) devem fechar em 2–3 dias, deixando 2–3 dias de folga antes da final.

## Seção 1. Espelho do input — o que eu entendi

- **O que você me deu:** as respostas formais da ACM (Dr. Marcello Alberton Herdt, Diretor de Inovação) às perguntas encaminhadas pelo time sobre gestão de risco/protocolos, dados/indicadores/personas, histórico de iniciativas e escopo técnico da PoC — mais o contato para dúvidas adicionais (S8). Também está em jogo o restante da documentação de produto já existente (PRD, ADR-001, ADR-002, user-stories, roadmap), que hoje descreve uma arquitetura mais ambiciosa em alguns pontos (canal cifrado ao vivo médico-psicólogo, S9/S11; matching de pares, S10) do que o mínimo que a ACM acabou de confirmar como suficiente (S1, S3, S5).
- **O que você parece querer alcançar:** atualizar PRD/user-stories/roadmap (e possivelmente abrir uma ADR) para refletir essas respostas, e entender os próximos passos concretos para os 6 dias restantes até a final de 25/07 (S13), dado que Mauricio segue sozinho na parte técnica (S12). Confiança: Alta — foi dito explicitamente no pedido.
- **Intenções adjacentes notadas, não assumidas:** você mencionou usar "utils-pm skills" para rastrear isso — interpretei como pedido de um artefato PM reusável (este plano) mais recomendações de skills subsequentes (Seção 7), não como pedido para eu já executar as mudanças de código ou enviar o e-mail de esclarecimento à ACM sem confirmação sua.

## Seção 2. Classificação da situação (Cynefin)

**Domínio:** Complicado
**Source:** S1, S2, S3, S5, S9, S10, S11

A relação causa-efeito aqui é conhecível por análise: comparar o que a ACM confirmou (S1, S2, S3, S5) com o que já está documentado (S9, S10, S11) é um exercício de expertise em produto, não uma aposta às cegas — não há sinal de crise ativa nem de imprevisibilidade de comportamento de usuário (isso seria Complexo). A postura correta é "analisar, depois comprometer-se": decidir o novo escopo por escrito (ADR) e então executar, em vez de rodar experimentos exploratórios. O teto de confiança é Média-Alta, não Alta, porque ainda restam detalhes operacionais não especificados pela ACM (ex.: lista concreta de canais SUS/privado) que exigem uma pergunta de acompanhamento (ver Q1, Seção 4) antes de fechar 100% do texto final de produto.

## Seção 3. A restrição vinculante (Theory of Constraints)

- **Sistema e objetivo:** entregar, em 25/07 (S13), uma demo TRL3 defensável perante a banca, dentro do critério de avaliação que a própria ACM acabou de nomear (S5).
- **A restrição:** capacidade de engenharia solo de Mauricio (dev + DevOps, S12) nos 6 dias restantes — fixa, não expansível — precisa agora absorver um requisito novo (follow-up, S4/S5) sem ganho de tempo adicional.
- **Source:** S12 (capacidade solo), S13 (prazo fixo), S4/S5 (requisito novo confirmado)
- **Restrições candidatas consideradas:** (a) "falta de validação clínica" — descartada como restrição vinculante porque o Dr. Marcello já se ofereceu como validador (S1, S3), então isso é disponível, não escasso; (b) "critério de avaliação pouco claro" — também descartada, porque a ACM acabou de resolver isso explicitamente em 4.1 (S5). A restrição real é puramente de capacidade/tempo, agora que a incerteza de escopo foi removida.
- **Por que P1 alivia a restrição:** ao formalizar por escrito (ADR) que o canal ao vivo cifrado (S9, S11) e o polimento de matching de pares (S10) deixam de ser prioridade de engenharia, Mauricio libera horas concretas dos próprios itens já listados no roadmap (S11) para redirecionar ao gap confirmado (follow-up, P2) — sem essa decisão documentada, o roadmap atual (S11) continua puxando trabalho para algo que a ACM disse não ser necessário (S1).

## Seção 4. Perguntas, lacunas e decisões priorizadas

| Rank | Pergunta / lacuna | Por que importa | Decisão necessária? | Como resolver |
|---|---|---|---|---|
| Q1 | Existe uma lista concreta de canais SUS vs. plano de saúde/privado para o "direcionamento correto" (S1), ou o time precisa compilar isso sozinho (CVV 188 + genérico)? | Bloqueia o texto final de FR-7–FR-10 e a cópia de UI do direcionamento | Sim, bloqueia P3 (mas não bloqueia P1/P2, que podem seguir com placeholder documentado) | E-mail direcionado à ACM (S8) — ver P4 |
| Q2 | Matching de pares (US-005/FR-11, S10) fica como bônus simulado no demo ou é totalmente despriorizado para concentrar horas no fluxo confirmado (S5)? | Define quanto de capacidade solo (S12) fica livre para o follow-up (P2) | Sim, bloqueia a redação final da ADR (P1) e a realocação do roadmap (P3) | Decisão do time/Mauricio, documentada na ADR |
| Q3 | Qual a definição mínima viável de "follow-up" a construir em ≤2 dias — um único re-contato agendado com registro binário de resposta, ou algo recorrente? | Bloqueia o escopo de P2; sem isso o risco é over-engineering (ver Risco 4) | Sim, bloqueia P2 | Decisão de produto de Mauricio, escrita no PRD/US antes de codar |
| Q4 | O canal cifrado ao vivo médico-psicólogo (S9, S11) é cortado por completo ou mantido como caminho simulado/rotulado (mesmo padrão de honestidade já usado em ADR-001/ADR-002)? | Define se a tarefa 🔧 já listada em `mauricio.md` (S11) é removida, simplificada ou mantida como está | Sim, bloqueia P1 | Decisão registrada na própria ADR (P1) |
| Q5 | Vale a pena enviar o e-mail de esclarecimento (P4) mesmo sabendo que pode não haver resposta a tempo do dia 25/07 (S13)? | Molda se P4 é tratado como bloqueante ou como aposta de baixo custo | Não, não bloqueia P1–P3 | Enviar mesmo assim — é paralelo e de custo mínimo |

## Seção 5. O plano de ação priorizado

#### P1. ADR: re-escopo do protocolo de crise e do apoio entre pares

- **Why:** alivia diretamente a restrição de capacidade (Seção 3) ao remover, por decisão documentada, o trabalho de maior custo técnico que a própria ACM disse não ser necessário (S1) — sem esse registro formal, o roadmap atual (S11) continua reservando dias de um dev solo (S12) para uma integração ao vivo que não é o critério de avaliação (S5).
- **What:** uma nova ADR-003 decidindo (a) simplificar FR-7–FR-10 de "conexão ao vivo com token efêmero" para "sinalização + direcionamento diferenciado SUS/privado, sem integração técnica direta" (S1), mantendo o caminho de recusa/linha externa (FR-9, já alinhado); e (b) despriorizar horas de engenharia em US-005/FR-11 além do já simulado (S10), já que não é citado no critério de avaliação (S5).
- **How:**
  1. Redigir a ADR seguindo o padrão de ADR-001/ADR-002 (contexto, decisão, consequências, alternativas).
  2. Resolver Q2 e Q4 (Seção 4) como parte da própria redação da decisão, não depois.
  3. Atualizar FR-7–FR-10 na `prd.md` e a US-003/US-004 em `user-stories.md` para refletir o novo texto (ou deixar isso explícito como consequência da ADR, a executar em P3).
  4. Marcar a tarefa 🔧 "canal cifrado de ponta a ponta" em `roadmap/mauricio.md` (S11) como superada/simplificada, referenciando a ADR.
- **Confidence:** Alta — a fonte primária (S1) é uma instrução direta e inequívoca do demandante.
- **Source:** S1, S9, S11
- **Expected outcome / success signal:** roadmap de Mauricio para os próximos dias já não lista "configurar canal cifrado de ponta a ponta" como tarefa aberta; horas realocadas ficam visíveis em `mauricio.md`.
- **Estimated effort:** 1–2 horas (redação) + decisão rápida do time sobre Q2/Q4.
- **Dependencies:** nenhuma — pode começar hoje.

#### P2. Construir o mecanismo mínimo de follow-up

- **Why:** é o único item do critério de avaliação explicitamente nomeado pela ACM (S5) que hoje não existe em nenhuma user story, FR ou tarefa de roadmap — é a lacuna com maior risco de reprovação silenciosa se ignorada.
- **What:** um FR novo (ex. FR-17) e uma US-009 cobrindo: reenvio de um contato de acompanhamento após a interação inicial (chat/notificação), registro local de resposta sim/não, e as duas métricas nomeadas pela ACM (S4): nº de questionários respondidos + taxa de resposta do follow-up, exibidas no painel do gestor (US-006).
- **How:**
  1. Resolver Q3 (Seção 4) antes de codar — escopo mínimo, não recorrente.
  2. Escrever a user story (US-009) e critérios de aceite no mesmo formato das demais em `user-stories.md`.
  3. Implementar o disparo do follow-up + contador de respostas (dado simulado/anonimizado é aceitável para a demo, mesmo padrão já usado em US-005/US-006).
  4. Adicionar as duas métricas de follow-up ao painel agregado (FR-12/FR-16 já existentes).
- **Confidence:** Média — a necessidade é clara (S4, S5), mas o desenho exato de UX ainda depende de Q3.
- **Source:** S4, S5
- **Expected outcome / success signal:** painel do gestor exibe "taxa de resposta do follow-up" como métrica visível na demo do dia 25/07.
- **Estimated effort:** 1,5–2 dias de desenvolvimento (timeboxed — ver Risco 4).
- **Dependencies:** P1 concluído (para ter capacidade liberada); Q3 resolvida.

#### P3. Atualizar PRD, user-stories e roadmap

- **Why:** documentação de produto é entregável obrigatório do checklist do desafio e é a fonte de verdade que a banca e o próprio time consultam — sem atualizar, o PRD continua descrevendo uma arquitetura (S9, S10) que a ADR (P1) acabou de descontinuar, gerando inconsistência visível para quem avaliar a documentação.
- **What:** PRD (`prd.md`) com FR-1/FR-3 refletindo GAD-2/PHQ-2 → GAD-7/PHQ-9 (S2), FR-7–FR-10 revisados (P1), FR-17 novo (P2); `user-stories.md` com US-001 atualizada (resolve a "Pergunta em Aberto" já existente sobre qual subconjunto de escalas usar) e US-009 nova; `roadmap/mauricio.md` e `README.md` realocando os dias restantes (19–25/07) conforme P1/P2.
- **How:**
  1. Atualizar FR-1/FR-3 e US-001 citando S2 diretamente (resolve a pergunta em aberto já registrada no próprio `user-stories.md`).
  2. Aplicar as mudanças de FR-7–FR-10 decididas na ADR (P1).
  3. Adicionar FR-17/US-009 (follow-up, de P2).
  4. Reescrever a tabela "Rodada de decisões" e "Próximos passos abertos" do `roadmap/README.md` com a data de hoje (19/07) e o novo prazo real (6 dias, não mais 14 como registrado em 11/07).
- **Confidence:** Alta — é trabalho de transcrição de decisões já tomadas em P1/P2, não uma nova decisão de produto.
- **Source:** S2, S5
- **Expected outcome / success signal:** nenhum documento de produto contradiz a ADR-003 ou as respostas da ACM.
- **Estimated effort:** 2–3 horas.
- **Dependencies:** P1 (para FR-7–FR-10) e P2 (para FR-17) já decididos, mesmo que a implementação de P2 ainda esteja em andamento.

#### P4. Enviar e-mail de esclarecimento direcionado à ACM

- **Why:** reduz o risco residual identificado em Q1/Q2 (Seção 4) a um custo quase zero, usando o canal que a própria ACM abriu para isso (S8) — não bloqueia P1–P3, mas pode evitar retrabalho se a resposta chegar a tempo.
- **What:** um e-mail curto para hudsonsilva@acm.org.br (cc preincubadora.fln@ifsc.edu.br, assunto já especificado) perguntando: (a) se há lista concreta de canais SUS/privado para o direcionamento (Q1); (b) se matching de pares é esperado ou pode ficar apenas como bônus simulado (Q2).
- **Confidence:** Alta em ser enviado, Média em receber resposta a tempo — janela é curta (S13).
- **Source:** S8
- **Expected outcome / success signal:** resposta da ACM confirmando ou ajustando Q1/Q2 antes de 23/07, ou, na ausência de resposta, confirmação de que seguir com as respostas já escritas em S1/S3/S5 é suficiente.
- **Estimated effort:** 20–30 minutos.
- **Dependencies:** nenhuma — pode ser enviado em paralelo a P1.

#### P5. Incorporar as respostas da ACM à narrativa do pitch final

- **Why:** a ACM nomeou, com as próprias palavras, exatamente o que conta para a avaliação (S5) e validou de forma independente o benchmark que o time já usa (S6, já presente em `competitive-analysis.md`) — usar essas palavras no pitch reduz a distância entre o que a banca espera ouvir e o que Raquel vai apresentar.
- **What:** trecho do roteiro de pitch citando textualmente o critério de avaliação da ACM (S5) e a lente de "acolhimento em serviço novo sem histórico de confiança" (S7) como enquadramento da proposta de valor.
- **Confidence:** Alta — é reaproveitamento direto de texto já escrito pelo próprio demandante.
- **Source:** S5, S6, S7
- **Expected outcome / success signal:** roteiro final de pitch (Raquel) cita a ACM como fonte do critério de sucesso, não apenas o time.
- **Estimated effort:** 30–45 minutos.
- **Dependencies:** nenhuma.

**Sequenciamento (Agora / Próximo / Depois)**

| Agora | Próximo | Depois |
|---|---|---|
| P1 | P2, P3, P4 | P5 |

**O que fica para depois / o que NÃO fazer**

- Não continuar construindo o canal cifrado de ponta a ponta médico-psicólogo (S9, S11) além do que já existir — a ACM disse explicitamente que integração técnica direta não é esperada nesta fase (S1).
- Não investir mais horas de polimento em matching de pares (US-005) além do que já está simulado e funcionando (S10) — não é citado no critério de avaliação (S5).
- Não reabrir a busca por licenciamento do MBI-HSS (já decidido contra em ADR-002) — a ACM nem menciona a escala como necessária (S5), o que reforça, não reverte, essa decisão.
- Não esperar a resposta do e-mail de esclarecimento (P4) para continuar P1–P3 — seguir com as respostas já escritas (S1, S3, S5) como suficientes até (ou se) uma resposta chegar.

## Seção 6. Riscos e pré-mortem

| Risco | Probabilidade | Impacto | Sinal precoce | Mitigação | Source |
|---|---|---|---|---|---|
| Mauricio constrói o follow-up (P2) tarde demais na semana, sem margem, e ele chega quebrado/incompleto ao dia da demo | Média | Alta | Nenhum protótipo funcional de follow-up até 22/07 | Timebox de 2 dias, escopo mínimo fixado em Q3 antes de codar | S12 |
| Time continua trabalhando no canal cifrado ao vivo (S11) por hábito/inércia antes de aplicar a ADR (P1) | Média | Alta | Commits/horas registradas na tarefa "canal cifrado" em `mauricio.md` depois de 20/07 sem a ADR ter sido lida | Mauricio aplica a ADR antes de tocar essa tarefa; marcar a linha em `mauricio.md` como superada imediatamente após P1 | S11 |
| Cortar visibilidade do matching de pares (US-005) se revela errado, caso a composição real da banca avaliadora não seja idêntica ao critério descrito por Dr. Marcello | Baixa-Média | Média | Nenhum sinal disponível ainda — é exatamente por isso que Q2/P4 existem | Não excluir US-005, apenas despriorizar horas extras nele; manter como caminho de demo funcional de baixo custo | S5, S10 |
| Escopo de "follow-up" (P2) cresce além das duas métricas nomeadas pela ACM (S4), consumindo dias reservados para polimento da demo | Média | Média | Backlog de follow-up crescendo além de 1–2 tarefas discretas | Escopar P2 estritamente às duas métricas citadas (S4); qualquer coisa além vira "Consideração Futura" no PRD, mesmo padrão já usado para MBI-HSS/NR-1 | S4 |
| E-mail de esclarecimento (P4) não é respondido a tempo do dia 25/07 | Média | Baixa-Média | Nenhuma resposta até 22/07 | Tratar como upside apenas — seguir com S1/S3/S5 como suficientes independentemente da resposta | S8, S13 |

## Seção 7. Prompts recomendados para pm-skills (prontos para copiar/colar)

#### Para executar P1: ADR de re-escopo do protocolo de crise e apoio entre pares

**Skill:** `develop-adr`
**Why this skill:** é exatamente o formato já usado em ADR-001 e ADR-002 neste mesmo projeto — Nygard format, decisores, contexto, decisão, consequências, alternativas.
**Source:** S1, S3, S9, S10, S11

**Prompt:**
> Crie uma ADR (seguindo o mesmo formato de `general-documentations/documentacao-produto/adr-001-fr16-nr1-painel-gestor.md` e `adr-002-mbi-hss-direction.md`) para o projeto Zelo, decidindo: (1) simplificar FR-7–FR-10 da PRD de "conexão ao vivo médico-psicólogo via token de sessão efêmero" para "sinalização de risco agudo + direcionamento diferenciado por vínculo (SUS vs. plano de saúde/rede privada), sem integração técnica direta com serviços de emergência" — decisão baseada na resposta da ACM (Dr. Marcello Alberton Herdt, Diretor de Inovação): "a solução deve realizar a devida comunicação para os canais de serviços de emergência já existentes, com direcionamento diferenciado conforme o vínculo do profissional [...] Não é esperada integração técnica direta com esses serviços nesta fase; o essencial é o direcionamento correto e imediato"; (2) despriorizar horas de engenharia adicionais em US-005/FR-11 (matching anônimo de pares), mantendo apenas o que já está simulado, já que a ACM não cita essa funcionalidade como parte do critério de avaliação da PoC. Contexto adicional: hoje é 19/07/2026, a final é 25/07/2026, e Mauricio é o único responsável técnico (dev + DevOps). Referencie `prd.md` (FR-7 a FR-11), `user-stories.md` (US-003, US-004, US-005) e `roadmap/mauricio.md` (tarefa do canal cifrado) como documentos afetados.

#### Para executar P2: especificar a user story de follow-up antes de construir

**Skill:** `deliver-user-stories`
**Why this skill:** o projeto já mantém todas as US no mesmo arquivo/formato (`user-stories.md`) com critérios de aceite embutidos — este é o padrão a seguir para a nova US-009.
**Source:** S4, S5

**Prompt:**
> Escreva uma nova user story (US-009) no mesmo formato das demais em `general-documentations/documentacao-produto/user-stories.md` (persona, prioridade, épico, estimativa, contexto, critérios de aceite Given/When/Then, notas de design/técnicas, dependências, fora do escopo, perguntas em aberto), cobrindo um mecanismo mínimo de acompanhamento (follow-up) pós-interação inicial. Requisito de origem (resposta da ACM, Dr. Marcello Alberton Herdt): "os KPIs prioritários para esta fase são, essencialmente, o número de questionários respondidos e a taxa de resposta da pesquisa de seguimento (follow-up)" e "o critério de avaliação está na robustez desse fluxo de triagem → direcionamento → follow-up". Escopo deve ficar estritamente nas duas métricas citadas (nº de questionários respondidos + taxa de resposta do follow-up) — qualquer funcionalidade além disso deve virar nota de "Fora do Escopo" na própria US, não expandir o requisito. Prioridade sugerida: P0 (é o único critério de avaliação nomeado pela ACM ainda ausente do backlog). Prazo de implementação: até 2 dias, com a final em 25/07/2026.

#### Para executar P3: atualizar a PRD com as respostas da ACM

**Skill:** `deliver-prd`
**Why this skill:** a `prd.md` já existe e segue um formato de PRD estruturado neste projeto; a atualização deve incrementar a versão existente (1.1 → 1.2), não recriar o documento do zero.
**Source:** S2, S5

**Prompt:**
> Atualize `general-documentations/documentacao-produto/prd.md` (versão 1.1 → 1.2) incorporando as respostas recebidas da ACM em 19/07/2026: (1) FR-1 e FR-3 devem citar explicitamente o modelo de triagem em duas etapas — GAD-2 e PHQ-2 como primeiro filtro (2 perguntas cada), expandindo para GAD-7 e PHQ-9 apenas se a pontuação for ≥3 — resolvendo a "Pergunta em Aberto" já registrada em `user-stories.md` (US-001) sobre qual subconjunto de escalas cabe no prazo; (2) adicionar FR-17 cobrindo o requisito de follow-up (nº de questionários respondidos + taxa de resposta do follow-up), com link para a ADR-003 e US-009; (3) revisar FR-7–FR-10 conforme a decisão da ADR-003 (P1); (4) atualizar a seção "Perguntas em Aberto" registrando que o critério de avaliação da PoC foi confirmado pela ACM como "robustez do fluxo de triagem → direcionamento → follow-up", citando a fonte (Dr. Marcello Alberton Herdt, Diretor de Inovação — ACM, 19/07/2026). Manter o histórico de revisões no rodapé do documento.

## Seção 8. Mapa de evidências

| Alegação / recomendação | Source ID | Citação exata |
|---|---|---|
| Protocolo de crise não exige integração técnica direta | S1 | "Não é esperada integração técnica direta com esses serviços nesta fase" |
| Triagem em duas etapas (GAD-2/PHQ-2 → GAD-7/PHQ-9) | S2 | "recomendamos o uso do GAD-2 e do PHQ-2 como primeiro filtro" |
| Apoio entre pares = direcionamento a canais profissionais curados, não matching aleatório | S3 | "a expectativa é uma comunicação específica com canais de apoio" |
| Follow-up é KPI prioritário e não existe hoje no backlog | S4 | "a taxa de resposta da pesquisa de seguimento (follow-up)" |
| Critério de avaliação da PoC = robustez de triagem→direcionamento→follow-up | S5 | "o critério de avaliação está na robustez desse fluxo de triagem → direcionamento → follow-up" |
| Zenklub já é benchmark documentado e validado de forma independente pela ACM | S6 | "plataformas como a Zenklub (Psicologia Viva)" |
| Arquitetura atual da PRD é mais ambiciosa do que o mínimo confirmado | S9, S10 | "gerar um token de sessão efêmero que conecta ao psicólogo" / "conexão anônima com outro par treinado" |
| Tarefa do canal cifrado ainda está aberta no roadmap | S11 | "Configurar o canal cifrado de ponta a ponta [...] no caminho de crise" |
| Capacidade técnica é solo (Mauricio) | S12 | "Mauricio confirmou que assume integralmente o papel de DevOps" |
| Prazo final é 25/07/2026 | S13 | "25/07/2026" |

**Alegações Inferidas (baixa confiança):** o risco "matching de pares pode ser esperado pela banca real" (Seção 6) é parcialmente inferido — não há fonte direta indicando que a banca avaliadora diverge do critério escrito pela ACM; é uma hipótese de prudência, não um fato citado. Não fundamenta a restrição vinculante nem o P1.
**Lacunas de evidência:** a ACM não forneceu uma lista concreta de canais/linhas SUS vs. privado (ver Q1); isso é tratado como lacuna a resolver via P4, não como fato assumido.

---

Posso executar os prompts acima (P1–P3) através do `utility-pm-workflow-orchestrator`, em modo CHECKPOINTED (uma pausa de confirmação por etapa). Quer que eu prossiga?
