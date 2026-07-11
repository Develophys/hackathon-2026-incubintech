---
artefato: adr
versão: "1.1"
criado: 2026-07-11
atualizado: 2026-07-11
status: aceito
---

# ADR-001: Enquadramento de conformidade NR-1 (PGR/GRO) no painel agregado do gestor

## Status

**Aceito** em 11/07/2026, por Mauricio (coordenação de escopo do produto — ver `prd.md`, "Perguntas em Aberto", resolvido em 11/07/2026).

**Data:** 2026-07-11
**Decisores:** Mauricio (coordenação de escopo, confirmado em 11/07/2026).

## Contexto

O painel agregado do gestor hospitalar (FR-12/FR-13 na `prd.md`; `docs/superpowers/specs/screens/13-manager.md`) hoje exibe apenas "tendências da equipe" — sinais de burnout por setor/turno, com limiar de k-anonimato (n≥5) para evitar re-identificação. Nada no produto hoje enquadra esse painel como evidência de gestão de risco psicossocial para fins da NR-1, que entra em vigência fiscalizatória plena em maio de 2026 (`problem-statement.md`).

A análise competitiva (`competitive-analysis.md`) identificou que essa é a maior lacuna de diferenciação do produto: ferramentas de compliance NR-1 (NR Guard, Solides, Moodar) fazem gestão de risco psicossocial mas oferecem zero cuidado individual ao médico; ferramentas de cuidado individual específicas de médico (VITAL WorkLife) fazem relatório de governança, mas não são NR-1/Brasil. Nenhum concorrente une as duas frentes — e é exatamente isso que transformaria a compra do Zelo de "bem-estar opcional" em "instrumento de conformidade legal" do lado do hospital pagante (`differentiation-traceability.md`, "Gap Prioritário").

**Forças em jogo:**
- **A favor de agir agora:** é a alavanca comercial mais forte identificada; o prazo regulatório (maio/2026) já passou, então hospitais estão comprando ferramentas de compliance NR-1 *agora*; a Semana 2 do roadmap (12–18/07) é o foco de implementação do painel — depois disso a janela de baixo custo de adicionar isso se fecha.
- **Contra agir agora:** não há parceiro jurídico ou de SST confirmado que valide que o formato de dado proposto é aceito como evidência real de PGR — construir algo que *parece* compliance sem *ser* compliance é um risco reputacional maior do que não ter a funcionalidade; o prazo do checkpoint de 18/07 é apertado; qualquer novo formato de dado herda obrigatoriamente a regra de k-anonimato (FR-12/FR-13, n≥5) já implementada, o que limita o quanto de granularidade pode ser exposto de forma defensável.

## Decisão

Vamos incluir uma versão **mínima e honestamente rotulada** do enquadramento NR-1 no painel do gestor para o PoC dos 28 dias — não um "relatório de compliance" completo, mas uma camada de rotulagem que mapeia as métricas já existentes (sinais de burnout por setor/turno) aos fatores de risco psicossocial reconhecidos pela NR-1 (sobrecarga, jornada, esgotamento), com uma exportação simples (PDF/CSV) explicitamente rotulada como **"insumo para o PGR"**, não como "certificado de conformidade NR-1".

Isso vira **FR-16** na PRD:

> FR-16: O painel agregado deve apresentar as métricas existentes também rotuladas como fatores de risco psicossocial mapeáveis ao PGR (ex.: "sobrecarga", "jornada", "esgotamento por setor"), com exportação simples (PDF/CSV), sempre herdando as restrições de anonimato de FR-13. O rótulo e a documentação de apoio devem deixar explícito que isso é um insumo para a gestão de risco psicossocial do empregador, não uma certificação de conformidade — essa distinção deve ser validada com um parceiro jurídico/SST antes da fala final da banca.

**O que fica fora desta decisão (explicitamente excluído):**
- Qualquer alegação de que o Zelo "garante conformidade com a NR-1" — isso exige validação jurídica que o time não tem dentro do prazo.
- Qualquer novo dado granular que exija reduzir o limiar de k-anonimato (n≥5) abaixo do já definido.
- Integração com sistemas de eSocial/PGR de terceiros (fora de escopo, como já registrado em `prd.md`, "Fora do Escopo").

## Consequências

### Positivas

- Fecha a lacuna de maior valor estratégico identificada na análise competitiva, sem inventar uma funcionalidade nova do zero — é só uma camada de rotulagem/exportação sobre dados que o painel (FR-12/FR-13) já vai produzir.
- Dá ao pitch final (Raquel) um argumento concreto e demonstrável de "viabilidade econômica" perante a banca (critério do edital), em vez de apenas uma menção qualitativa.
- Reduz o risco identificado no plano de ação: sem essa decisão, a Semana 2 corria o risco de implementar o painel sem esse diferencial, perdendo a janela antes do checkpoint de 18/07.

### Negativas

- Adiciona escopo a uma Semana 2 que já está cheia (Mauricio absorveu também as tarefas de DevOps do Gui — ver `roadmap/mauricio.md`); é trabalho de rotulagem/copy mais que de arquitetura nova, mas ainda é esforço extra num prazo apertado.
- Risco reputacional se a rotulagem "insumo para o PGR" for lida pela banca (ou por um hospital real) como uma alegação de compliance mais forte do que o time pode sustentar sem validação jurídica — precisa de revisão de linguagem cuidadosa antes da demo.
- Cria uma dependência nova (ainda que leve): alguém precisa revisar o texto do rótulo com um mentor jurídico/SST da Jornada antes da fala final, o que não estava no roadmap original.

### Neutras

- Não exige nenhuma mudança na arquitetura de privacidade já decidida (k-anonimato, agregação) — é estritamente uma camada de apresentação/exportação sobre dados que já existiriam de qualquer forma.
- Se a validação jurídica não acontecer a tempo, o time ainda pode apresentar a funcionalidade na demo com a ressalva explícita "isso é uma direção de produto, a validação formal do formato como evidência de PGR é o próximo passo pós-hackathon" — sem que isso invalide a decisão tomada aqui.

## Alternativas Consideradas

### Opção A — Relatório de compliance NR-1 completo agora

Implementar um mapeamento completo aos fatores de risco psicossocial da NR-1 (metodologia COPSOQ-BR ou equivalente) e uma exportação formal pronta para uso no PGR do hospital, replicando o que ferramentas como NR Guard fazem, mas com a camada de cuidado individual do Zelo por cima.

**Por que não foi escolhida agora:** exigiria validação metodológica com um parceiro jurídico/SST que o time não tem confirmado, dentro de um prazo de 7 dias até o checkpoint de 18/07 (S1, `problem-statement.md`). O risco de "parecer compliance sem ser" é alto demais para o tempo disponível. Fica registrada como evolução natural pós-hackathon/pré-incubação.

### Opção B — Adiar inteiramente para "Consideração Futura"

Não tocar no painel do gestor além do que já está especificado (FR-12/FR-13), e registrar o enquadramento NR-1 apenas como uma nota estratégica em `prd.md`, "Considerações Futuras", sem nenhuma implementação nesta janela de 28 dias.

**Por que não foi escolhida:** desperdiça a alavanca de diferenciação de maior valor identificada na análise competitiva, num momento em que hospitais brasileiros estão ativamente comprando ferramentas de compliance NR-1 (`competitive-analysis.md`, "Contexto de Mercado"). O custo de implementar a versão mínima (rotulagem + exportação, Decisão acima) é baixo o suficiente para não justificar adiar por completo.

## Referências

- `general-documentations/documentacao-produto/competitive-analysis.md` — seção "Gaps e Oportunidades Competitivas" e "Recomendações Estratégicas"
- `general-documentations/documentacao-produto/differentiation-traceability.md` — "Gap Prioritário: Enquadramento de Conformidade NR-1 no Painel do Gestor"
- `general-documentations/documentacao-produto/prd.md` — FR-12, FR-13, e a pergunta em aberto sobre FR-16
- `docs/superpowers/specs/screens/13-manager.md` — especificação atual do painel (regra de n≥5)
- `general-documentations/documentacao-produto/problem-statement.md` — contexto legal da NR-1 (vigência fiscalizatória plena, maio/2026)
