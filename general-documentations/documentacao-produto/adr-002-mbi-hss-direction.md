---
artefato: adr
versão: "1.0"
criado: 2026-07-12
atualizado: 2026-07-12
status: aceito
---

# ADR-002: Direção do MBI-HSS enquanto a escala segue indisponível (licenciamento)

## Status

**Aceito** em 12/07/2026, por Mauricio (coordenação de escopo do produto).

**Data:** 2026-07-12
**Decisores:** Mauricio (coordenação de escopo).

## Contexto

O seletor de autoavaliação (`docs/superpowers/specs/screens/05-assessment-select.md`) já exibe
MBI-HSS como linha desabilitada, rótulo "em breve". Isso não é um placeholder de UI pendente —
é uma decisão técnica deliberada já registrada em
`docs/superpowers/plans/2026-07-07-06-assessment-vertical.md`: o texto dos itens do MBI-HSS é
propriedade da Mind Garden, Inc., e `ScoreAssessmentUseCase` lança um erro explícito e
documentado se chamado com `"MBI-HSS"`, em vez de simular um resultado. A PRD (FR-1) já previa
essa possibilidade ao permitir "PHQ-9, GAD-7 e/ou MBI-HSS (ou subconjunto validado com parceiro
clínico)".

Em 12/07/2026, quatro referências foram trazidas para reabrir essa frente:

1. `https://www.revistas.unipar.br/index.php/saude/article/view/7875/4007` — artigo acadêmico
   brasileiro (revisão integrativa sobre uso do MBI-HSS em pesquisas brasileiras).
2. `https://www.researchgate.net/figure/Categorization-of-MBI-HSS-scores_tbl1_334400210` —
   tabela de categorização de escores (baixo/moderado/alto) publicada como figura de um artigo
   secundário.
3. `https://www.scielo.br/j/rlae/a/v9BRMzXSRVhsDKWXP3szbrf/?lang=pt&format=pdf` — artigo
   acadêmico brasileiro (validação fatorial do MBI-HSS em profissionais de saúde de
   emergência).
4. `https://smlr.rutgers.edu/sites/default/files/Documents/Faculty-Staff-Docs/maslach_burnout_inventory.pdf` —
   verificado nesta análise como um documento **da própria Mind Garden**, republicado por uma
   universidade. Não é uma fonte acadêmica secundária independente; é o material proprietário
   original, hospedado fora do canal comercial da Mind Garden.

**Achado central desta análise:** nenhuma das quatro fontes foi usada como origem de texto de
item. A referência 4 é, na prática, exatamente o tipo de material que a decisão original (Plano
06) já havia identificado como não utilizável — reproduzi-la aqui apenas documenta por que ela
**não** entra como fonte, para que a rastreabilidade fique explícita. As referências 1–3 foram
usadas estritamente para dois fins: (a) confirmar a estrutura de três dimensões do instrumento
(Exaustão Emocional, Despersonalização, Realização Profissional) — informação estrutural de
domínio público, não texto de item — e (b) extrair pontos de corte de categorização publicados
em literatura secundária.

**Forças em jogo:**
- **A favor de agir agora:** MBI-HSS é a única das três escalas do PRD ainda totalmente inerte;
  ter uma referência de bandas de escore e uma direção de produto documentada reduz o trabalho
  de retomada quando (se) o licenciamento ou um instrumento próprio validado destravar a
  funcionalidade real.
- **Contra agir além disso:** não há parceiro jurídico validando uso de conteúdo de terceiros;
  não há licença procurada nem orçamento para isso nos 28 dias; a literatura consultada não tem
  consenso sobre pontos de corte (ver "Decisão" abaixo) — declarar uma escala MBI-HSS
  funcional na demo sem isso seria uma alegação não sustentável perante a banca.

## Decisão

**A autoavaliação MBI-HSS permanece desabilitada ("em breve") nesta janela de 28 dias.** Esta
ADR não altera `ScoreAssessmentUseCase`, `AssessmentScaleType`, nem o estado desabilitado da
linha MBI-HSS no seletor. Nenhuma pontuação MBI-HSS real é produzida, armazenada ou exibida ao
médico ou ao gestor como resultado desta decisão.

O que esta ADR estabelece é uma **referência documentada**, para dois usos futuros:

**1. Bandas de escore de referência (não o instrumento em si).** Adotamos como referência de
trabalho de Zelo os pontos de corte abaixo, extraídos de literatura secundária brasileira sobre
populações de saúde (não da Mind Garden, não de item text):

| Subescala | Alto | Moderado | Baixo |
|---|---|---|---|
| Exaustão Emocional (EE) | ≥ 27 | 19–26 | ≤ 18 |
| Despersonalização (DP) | ≥ 10 | 6–9 | ≤ 5 |
| Realização Profissional (PA) | ≥ 40 | 34–39 | ≤ 33 |

*(PA é invertido: escore alto de PA = melhor realização profissional, não pior. A síndrome de
burnout no modelo Maslach é tipicamente descrita como EE alta + DP alta + PA baixa.)*

**Isso não é consenso de literatura — é declarado explicitamente como tal.** A pesquisa para
esta ADR confirmou que pesquisadores usam métodos de categorização divergentes (pontos de corte
fixos vs. percentis/tercis), sem um padrão único amplamente aceito. Por isso, esta tabela é
registrada como **"referência de trabalho do Zelo, não validada clinicamente"**, e vira item
explícito de pauta já existente: Bloco 1, pergunta 1 e Bloco 2, perguntas 5–6 de
`roteiro-entrevista-psicologos-parceiros.md`. Nenhuma comunicação externa (demo, pitch, banca)
deve descrever essas bandas como "critério validado" até essa conversa acontecer.

**2. Separação de nível de alerta.** Sinais derivados de MBI-HSS (hoje: apenas conceituais, via
`adr-002`/spec técnica irmã — ver Referências) **nunca** acionam o caminho de crise agudo
(FR-7–FR-10, o mesmo do item 9 do PHQ-9). MBI-HSS mede exaustão/cinismo/ineficácia crônicos, não
ideação suicida — são naturezas clínicas diferentes, e tratá-las com o mesmo gatilho arrisca
exatamente o problema de falso positivo que o próprio roteiro de entrevista já levanta (Bloco 1,
pergunta 2). Um nível de alerta mais suave — hoje, apenas calibração de tom e reforço do atalho
"falar com uma pessoa real" (FR-6b) no chat de acolhimento — é o único efeito prático permitido
por esta decisão. Ver `docs/superpowers/specs/2026-07-12-mbi-hss-chat-direction-design.md` para
o desenho técnico desse efeito.

**O que fica fora desta decisão (explicitamente excluído):**
- Qualquer texto de item do MBI-HSS (original ou traduzido) em código, copy ou documentação do
  produto.
- Qualquer alegação, em demo ou pitch, de que o Zelo "mede" ou "aplica" o MBI-HSS hoje.
- Qualquer ação de procurement/licenciamento junto à Mind Garden (registrado como caminho
  futuro, não iniciado).
- Qualquer mudança em `ScoreAssessmentUseCase`, `AssessmentScaleType` ou no estado da UI do
  seletor de escalas.

## Consequências

### Positivas

- Fecha a lacuna de rastreabilidade que o time já havia identificado como risco (Plano 06): a
  próxima pessoa que tocar MBI-HSS não parte do zero nem precisa repetir esta pesquisa.
  Documenta com precisão os limites entre o que já podemos afirmar publicamente e o que ainda é
  hipótese de produto.
- Constrói a direção conceitual de burnout (as três dimensões) na experiência de chat sem
  esperar pela resolução do licenciamento — extrai valor de produto de um instrumento
  reconhecido sem reproduzi-lo.
- Mantém consistência com a decisão anterior mais próxima em formato (ADR-001): rotular com
  honestidade o que é "insumo/direção" vs. o que é "funcionalidade validada".

### Negativas

- As bandas de escore documentadas aqui podem precisar de revisão completa após a conversa com
  os psicólogos parceiros — é trabalho declaradamente provisório.
- Não resolve a lacuna real do produto (PRD ainda lista MBI-HSS como parte do escopo original);
  apenas prepara o terreno para quando (se) for resolvida.

### Neutras

- Não exige nenhuma mudança de arquitetura de privacidade (score continua 100% client-side
  quando/se existir; nada nesta ADR envia dado bruto a servidor).
- Se o licenciamento nunca for resolvido dentro da vida útil do protótipo, o produto pode
  seguir apresentando as bandas de referência como direção de pesquisa/roadmap, sem que isso
  invalide o restante da decisão aqui tomada.

## Alternativas Consideradas

### Opção A — Escrever um instrumento original agora, inspirado no MBI-HSS, e destravar a UI

Redigir itens próprios (não literais) ao longo das três dimensões, validados informalmente
pelos psicólogos parceiros, e reabilitar a linha MBI-HSS no seletor nesta janela de 28 dias.

**Por que não foi escolhida agora:** exige ciclo de validação com os parceiros clínicos que
ainda não aconteceu (a conversa do Bloco 1–2 do roteiro de entrevista é pré-requisito, não
paralela) e um volume de trabalho de copy/QA que compete com o restante do roadmap da Semana 2.
Fica registrada como a opção mais provável para uma iteração futura, não descartada
permanentemente.

### Opção B — Buscar licenciamento real junto à Mind Garden

Tratada como caminho correto de longo prazo, mas fora de alcance nos 28 dias por custo e tempo
de procurement. Nenhuma ação foi iniciada.

### Opção C — Não fazer nada (deixar "em breve" sem documentação adicional)

Rejeitada porque desperdiça a pesquisa já feita (pontos de corte, estrutura de três dimensões,
avaliação das quatro fontes trazidas) e deixa a próxima retomada do tema sem rastro de decisão —
exatamente o tipo de lacuna que este time tem evitado ativamente em outras decisões (ver
ADR-001).

## Referências

- `docs/superpowers/plans/2026-07-07-06-assessment-vertical.md` — decisão original de manter
  MBI-HSS fora de escopo por licenciamento (linha 14).
- `docs/superpowers/specs/screens/05-assessment-select.md` — estado desabilitado atual da linha
  MBI-HSS.
- `packages/domain/src/entities/assessment.ts` — `ScoreAssessmentUseCase` lança erro por design
  para `"MBI-HSS"`.
- `general-documentations/documentacao-produto/prd.md` — FR-1 (permite subconjunto validado com
  parceiro clínico), FR-3 (critério de risco agudo ainda pendente de validação clínica).
- `general-documentations/documentacao-produto/roteiro-entrevista-psicologos-parceiros.md` —
  Bloco 1 (critérios de risco agudo) e Bloco 2 (escalas), pendências diretamente relacionadas
  às bandas de escore desta ADR.
- `docs/superpowers/specs/2026-07-12-mbi-hss-chat-direction-design.md` — desenho técnico do
  único efeito prático desta decisão (calibração de tom no chat de acolhimento).
- Fontes consultadas (12/07/2026): UNIPAR (`revistas.unipar.br/.../7875/4007`), ResearchGate
  (tabela de categorização, `tbl1_334400210`), SciELO RLAE (`v9BRMzXSRVhsDKWXP3szbrf`) — usadas
  para estrutura de dimensões e pontos de corte de categorização, nunca para texto de item.
  Rutgers PDF (`smlr.rutgers.edu/.../maslach_burnout_inventory.pdf`) — identificado como
  material da própria Mind Garden; registrado aqui como fonte **não utilizada**, para
  rastreabilidade.
