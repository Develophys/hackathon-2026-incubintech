---
artefato: competitive-analysis
versão: "1.0"
criado: 2026-07-11
status: rascunho
---

# Análise Competitiva: Zelo — Triagem e Suporte Confidencial à Saúde Mental do Médico

## Visão Geral

**Escopo da análise:** Plataformas que competem pelo orçamento institucional (hospital/cooperativa) e/ou pela atenção do médico individual no espaço de triagem, suporte e escalonamento de saúde mental relacionada a burnout.
**Segmento-alvo:** Médicos(as) com CRM ativo em alta carga assistencial (usuário final) e hospitais/cooperativas/sindicatos médicos em Santa Catarina (comprador institucional).
**Data:** 11/07/2026
**Analista:** Gerado via skill `discover-competitive-analysis`, a partir da documentação de produto existente (`problem-statement.md`, `prd.md`, `lean-canvas.md`) e pesquisa web.

## Contexto de Mercado

O Zelo não compete em um mercado único — compete simultaneamente em três frentes que hoje são atendidas por players separados: (1) suporte confidencial específico para médicos, (2) bem-estar mental corporativo genérico, e (3) conformidade regulatória com a NR-1. Nenhum concorrente identificado ocupa as três frentes ao mesmo tempo.

**Tamanho de mercado:** Não estimado nesta análise (fora do escopo — usar `discover-market-sizing` se necessário).
**Tendência:** Em forte crescimento no Brasil por um gatilho regulatório concreto e datado.
**Principais tendências:**
- A NR-1 entra em vigência fiscalizatória plena em maio/2026, tornando a gestão de riscos psicossociais obrigatória no PGR de qualquer empresa com empregados CLT — isso está gerando uma onda de software de compliance (NR Guard, Solides, Moodar, NR1PSICO) e transformando "bem-estar" em linha orçamentária de conformidade legal.
- Consolidação do mercado brasileiro de saúde mental corporativa (Zenklub captou R$45 mi; Vittude e Wellhub também competem pelo mesmo orçamento de RH).
- Chatbots de IA para saúde mental amadurecendo clinicamente (Wysa tem designação FDA Breakthrough Device), o que eleva a barra de credibilidade clínica esperada de qualquer "acolhimento por IA".
- Dado publicado pela Sermo (barômetro de médicos, 2025): 82% dos médicos relatam que o medo de consequências profissionais os impede de buscar tratamento de saúde mental para burnout — validação externa direta da tese central do Zelo.

## Concorrentes Analisados

| Concorrente | Tipo | Mercado-alvo | Fundação | Porte/Financiamento |
|---|---|---|---|---|
| Physicians Anonymous | Direto | Médicos e estudantes de medicina (EUA) | Não informado publicamente | ONG, sem fins lucrativos, gratuito |
| VITAL WorkLife | Direto | Hospitais e sistemas de saúde (EUA) | Não informado publicamente | Empresa estabelecida, B2B saúde |
| Wysa | Indireto | Saúde mental corporativa/global, inclui sistemas de saúde | 2016 | 20+ clientes enterprise, ~7M vidas cobertas globalmente |
| Zenklub | Indireto | Bem-estar corporativo genérico (Brasil) | Não informado publicamente | Captou R$45 mi; 1.000+ empresas clientes |
| NR Guard (categoria: software de compliance NR-1) | Disruptor potencial | Departamentos de SST/RH de empresas brasileiras | Não informado publicamente | Startup local; gratuito até 5 colaboradores |

## Matriz de Comparação de Funcionalidades

<!-- Full / Partial / None / Unknown -->

| Funcionalidade | Zelo (nós) | Physicians Anonymous | VITAL WorkLife | Wysa | Zenklub | NR Guard |
|---|---|---|---|---|---|---|
| Foco específico em médicos | Full | Full | Full | None | None | None |
| Confidencialidade/anonimato como proposta central | Full | Full | Full | Partial | Partial | Unknown |
| Arquitetura de privacidade verificável (client-side/E2E) | Full | None | Unknown | Unknown | None | Unknown |
| Autoavaliação clínica validada (PHQ-9/GAD-7/MBI-HSS) | Full | None | Unknown | Partial | Unknown | Partial (COPSOQ-BR, nível organizacional) |
| Chat de acolhimento por IA | Full | None | None | Full | None | None (usa IA só para gerar relatórios) |
| Matching anônimo de pares (médico-médico) | Full | Partial (grupos, não 1:1) | Full (coaching pareado) | None | None | None |
| Escalonamento humano em crise | Full | Partial | Full | Partial | Partial | None |
| Painel agregado para instituição pagante | Full | None | Full | Partial | Partial | Full |
| Relatório de conformidade NR-1 | Partial | None | None | None | Unknown | Full |
| Adequação ao mercado brasileiro | Full | None | None | Unknown | Full | Full |

## Comparação de Preços

| Concorrente | Entrada | Nível intermediário | Enterprise | Modelo de precificação |
|---|---|---|---|---|
| Zelo (nós) | A definir | A definir | A definir | SaaS B2B por médico ativo/mês (hipótese, não validada) |
| Physicians Anonymous | Gratuito | Gratuito | N/A | Doações/ONG |
| VITAL WorkLife | Sob consulta | Sob consulta | Sob consulta | Não divulgado publicamente (típico de EAP: contrato B2B anual) |
| Wysa | Sob consulta (enterprise) | Sob consulta | Sob consulta | Licenciamento B2B por vida coberta |
| Zenklub | ~R$22/vida/mês | ~R$25/vida/mês (~R$2.500/mês para 100 vidas) | Sob consulta | Por vida/mês, escala com nº de colaboradores |
| NR Guard | Gratuito até 5 colaboradores | Não divulgado | Não divulgado | Freemium/SaaS |

**Nota de confiança:** Preços de Zenklub e NR Guard vêm de páginas públicas/imprensa (confiança média-alta). VITAL WorkLife e Wysa não divulgam preço publicamente — comum em vendas B2B enterprise de ciclo longo; não deve ser tratado como benchmark direto sem contato comercial.

## Mapa de Posicionamento

**Eixo X:** Adequação ao mercado brasileiro (Baixa → Alta)
**Eixo Y:** Especificidade para médicos (Genérico → Nativo para médicos)

```
                 [Nativo p/ médicos]
                        |
  Physicians Anonymous  |
  VITAL WorkLife        |                    [Zelo — nós]
                        |
Baixa ------------------+------------------ Alta (Brasil)
                        |
             Wysa       |    Zenklub
                        |    NR Guard
                 [Genérico]
```

**White space identificado:** O quadrante "alta adequação ao Brasil + nativo para médicos" está vazio. Os concorrentes diretos (Physicians Anonymous, VITAL WorkLife) são nativos para médicos mas não operam no Brasil nem endereçam CRM/conselho profissional brasileiro. Os concorrentes locais (Zenklub, NR Guard) atendem bem o Brasil mas são genéricos — não desenhados para o medo específico do médico de expor o registro no CRM.

## Deep Dives dos Concorrentes

### Physicians Anonymous

**Visão geral:** ONG americana que oferece grupos de apoio entre pares (peer support) totalmente anônimos e confidenciais, especificamente para médicos, residentes e estudantes de medicina em sofrimento.
**Cliente-alvo:** Médico individual em busca de apoio "off the record", sem intermediação institucional.
**Diferencial-chave:** Anonimato absoluto por desenho — os participantes não precisam revelar identidade uns aos outros; meta declarada de reduzir o suicídio de médicos em 50% em 5 anos.

**Forças:**
- Validação de mercado direta da dor central do Zelo (medo de impacto no registro/licenciamento).
- Modelo gratuito remove qualquer fricção de adoção do lado do médico.
- Foco 100% médico, sem diluição por outras categorias profissionais.

**Fraquezas:**
- Anonimato é procedural/social (grupo, sem identificação), não uma arquitetura técnica verificável — não há criptografia client-side ou prova de que o dado nunca existiu em texto claro.
- Sem autoavaliação clínica validada, sem IA de acolhimento, sem painel institucional — não atende à necessidade do comprador pagante (hospital/cooperativa).
- Modelo sem receita limita capacidade de escalar cobertura de crise 24/7 com profissional humano.
- Não atua no Brasil; não endereça o contexto regulatório do CRM/CFM.

**Movimentos recentes:** Não identificados na pesquisa (organização pequena, sem imprensa recente disponível).

---

### VITAL WorkLife

**Visão geral:** Fornecedora americana de EAP (Employee Assistance Program) especializada exclusivamente no setor de saúde, com "Physician Peer Coaching" pareando médicos a coaches certificados — muitos deles também profissionais médicos licenciados.
**Cliente-alvo:** Hospitais, sistemas de saúde e grupos de especialidade nos EUA (comprador institucional).
**Diferencial-chave:** Taxa de engajamento de médicos 10x acima da média de EAPs tradicionais (4-5%), com relatório de governança para a instituição sem expor o indivíduo.

**Forças:**
- Modelo de negócio quase idêntico ao do Zelo: hospital paga, médico usa, painel agregado para gestão — é o concorrente mais próximo em termos de arquitetura de negócio (B2B2C saúde).
- Prova social forte: 96% dos usuários dizem que o coaching ajudou a permanecer na função.
- "Governance-level reporting" já validado como algo que hospitais compram.

**Fraquezas:**
- Sem chat de IA — modelo 100% humano, o que limita escala e disponibilidade 24/7 a baixo custo.
- Sem autoavaliação clínica digital integrada (PHQ-9/GAD-7/MBI) claramente documentada.
- Não opera no Brasil; não endereça NR-1, LGPD ou o medo específico do CRM/CFM.
- Preço não divulgado publicamente, o que sugere ciclo de venda B2B longo e caro — risco para um hospital de médio porte em SC dentro do prazo de piloto do Zelo.

**Movimentos recentes:** Não identificados na pesquisa (sem imprensa recente disponível na busca realizada).

---

### Wysa

**Visão geral:** Plataforma global de saúde mental com chatbot de IA baseado em TCC (terapia cognitivo-comportamental), com designação FDA Breakthrough Device, vendida via benefício corporativo a mais de 20 clientes enterprise (incluindo NHS e Cincinnati Children's Hospital).
**Cliente-alvo:** Empregadores e planos de saúde globais, incluindo sistemas hospitalares — mas não médicos especificamente.
**Diferencial-chave:** Rigor clínico do chatbot de IA, validado por estudos publicados e por reconhecimento regulatório (FDA).

**Forças:**
- Barra de credibilidade clínica para IA de acolhimento mais alta que qualquer concorrente nesta lista — referência a ser igualada pelo Zelo no quesito "IA não emite diagnóstico, mas é clinicamente responsável".
- Já vendido dentro de sistemas hospitalares (Cincinnati Children's), prova de que compradores de saúde aceitam IA de saúde mental como componente de um "ecossistema de cuidado" mais amplo.
- Escala global e capital para expandir para novos mercados, incluindo potencialmente o Brasil.

**Fraquezas:**
- Sem especificidade para médicos — não endereça o medo de exposição ao CRM/CFM nem oferece matching entre pares médicos.
- Não há evidência pública de arquitetura de privacidade client-side/verificável — a confiabilidade é baseada em certificação e política, não em prova técnica.
- Presença confirmada no Brasil não identificada na pesquisa — provável lacuna de localização (idioma, contexto regulatório NR-1/LGPD).

**Movimentos recentes:** Ampliação de parcerias enterprise (30+ clientes) e integração em modelos de "Collaborative Care" dentro de sistemas de saúde — sinal de intenção de aprofundar presença hospitalar.

---

### Zenklub

**Visão geral:** Marketplace brasileiro de terapia online, com forte vertical corporativa ("Zenklub para Empresas"), conectando colaboradores a psicólogos.
**Cliente-alvo:** RH de empresas brasileiras de qualquer setor, população geral de colaboradores (não específico a médicos).
**Diferencial-chave:** Escala e marca já estabelecidas no mercado brasileiro de bem-estar corporativo (1.000+ empresas clientes).

**Forças:**
- Já é a opção "padrão" que um RH brasileiro considera ao orçar saúde mental — concorre diretamente pela mesma verba institucional que o Zelo mira.
- Modelo de precificação testado e público (~R$22/vida/mês), o que dá um benchmark real de disposição a pagar no mercado brasileiro.
- Rede de psicólogos já formada — vantagem operacional que o Zelo (sem parceiro clínico confirmado, conforme `prd.md`) ainda não tem.

**Fraquezas:**
- Genérico: não desenhado para o medo específico do médico de expor o registro no CRM perante o próprio empregador que paga a ferramenta.
- Sem arquitetura de privacidade verificável — a confidencialidade é a do sigilo profissional psicológico padrão, não uma garantia técnica auditável.
- Sem autoavaliação clínica validada e específica de burnout médico (MBI-HSS), sem IA de acolhimento, sem fluxo de crise estruturado (aceite/recusa).

**Movimentos recentes:** Captação de R$45 milhões para expansão nacional (Exame) — sinal de que o mercado de bem-estar corporativo genérico no Brasil está bem capitalizado e pode se mover rápido para verticais adjacentes, incluindo saúde do médico, se enxergar demanda.

---

### NR Guard (representando a categoria de software de compliance NR-1)

**Visão geral:** Software brasileiro de gestão de riscos psicossociais (SST/PGR/GRO) que usa IA para gerar relatórios de conformidade com a NR-1, incluindo mapeamento via questionário COPSOQ-BR.
**Cliente-alvo:** Departamentos de SST/RH/Compliance de empresas brasileiras com empregados CLT — comprador institucional puro, sem interface com o colaborador final além de um questionário de mapeamento de risco.
**Diferencial-chave:** Automatiza exatamente a obrigação legal que entra em vigência fiscalizatória plena em maio/2026 — o mesmo gatilho comercial que o Zelo pretende usar (`problem-statement.md`).

**Forças:**
- Resolve a dor de compliance de forma mais barata e rápida que qualquer solução de cuidado individual — free tier até 5 colaboradores, foco total em geração de relatório (PGR/GRO) e integração com eSocial.
- Já usa IA para automatizar a parte burocrática, o que sinaliza que compradores institucionais brasileiros aceitam bem "IA + relatório de conformidade" como pacote.
- Representa uma categoria inteira de concorrentes adjacentes (Solides, Moodar, NR1PSICO) já disputando esse orçamento específico de NR-1.

**Fraquezas:**
- Não oferece nenhum caminho de cuidado ao indivíduo — nenhuma autoavaliação clínica pessoal, nenhum chat de acolhimento, nenhum escalonamento de crise, nenhum matching de pares.
- Não é específico para médicos nem para o contexto de alta carga assistencial/plantão.
- Um hospital pode "cumprir a letra da lei" da NR-1 com uma ferramenta como essa sem nunca oferecer suporte real ao médico — isso é uma ameaça de substituição barata ao argumento comercial do Zelo, não apenas um concorrente de funcionalidades.

**Movimentos recentes:** Categoria inteira em expansão acelerada por causa do prazo de maio/2026 — múltiplos entrantes (Solides, Moodar, NR1PSICO) surgindo simultaneamente, sinal de corrida por market share antes da fiscalização plena.

## Gaps e Oportunidades Competitivas

| Gap | Oportunidade | Valor Estratégico | Dificuldade |
|---|---|---|---|
| Nenhum concorrente combina especificidade médica + arquitetura de privacidade verificável + mercado brasileiro | Ocupar esse quadrante vazio do mapa de posicionamento como categoria própria | Alto | Alto |
| Ferramentas de compliance NR-1 (NR Guard e pares) não oferecem cuidado individual real | Empacotar o painel agregado do Zelo como "relatório NR-1 que também cuida de gente", vendendo a mesma verba de compliance com um produto mais completo | Alto | Médio |
| Concorrentes diretos (Physicians Anonymous, VITAL WorkLife) não têm arquitetura técnica de privacidade verificável, só confidencialidade procedural/política | Fazer da criptografia client-side e do "score nunca sai do dispositivo" o argumento de confiança central e demonstrável (não apenas prometido) — endereça diretamente a desconfiança de IA identificada na entrevista com Dr. David Mendes | Alto | Médio |
| Nenhum concorrente oferece o híbrido "IA sempre disponível + atalho humano sempre visível" (FR-6b) no mesmo produto | Usar esse híbrido como resposta direta ao dado da Sermo (82% de médicos com medo de consequências) e à pesquisa de usuário já feita pelo time | Médio-Alto | Baixo (já está no escopo do PRD) |

## Recomendações Estratégicas

### Onde competir de frente
1. **Rigor clínico da IA de acolhimento:** igualar a barra de credibilidade que a Wysa estabeleceu (base em evidência clínica, guardrails visíveis contra diagnóstico) — sem isso, qualquer hospital que já avaliou Wysa vai comparar o Zelo desfavoravelmente nesse eixo.
2. **Profundidade do relatório institucional:** igualar o nível de "governance-level reporting" da VITAL WorkLife e o enquadramento de compliance NR-1 da NR Guard no mesmo painel agregado — é isso que desbloqueia a verba, conforme já identificado no `lean-canvas.md` (gatilho NR-1).

### Onde diferenciar
1. Tornar a arquitetura de privacidade client-side/E2E um argumento de confiança **demonstrável na demo**, não uma frase de marketing — nenhum concorrente analisado prova isso tecnicamente.
2. Ancorar toda a comunicação no medo específico do CRM/CFM (não "saúde mental genérica") — é a lacuna exata que Physicians Anonymous e VITAL WorkLife preenchem nos EUA mas ninguém preenche no Brasil.
3. Vender o painel agregado simultaneamente como ferramenta de cuidado e como resposta à NR-1 — nenhum concorrente une as duas frentes hoje.

### Implicações de Mensagem
- Mensagem central: "o hospital paga, mas nunca vê você" — combinada com "privacidade que dá para provar, não só uma política em que você tem que confiar".
- Usar o dado público da Sermo (82% dos médicos com medo de consequências profissionais) como prova externa de mercado na comunicação com hospitais e na demo do checkpoint.
- Para o comprador institucional, liderar com "conformidade NR-1 que também cuida da sua equipe", não só "bem-estar" — reposiciona o Zelo do orçamento discricionário de RH para o orçamento obrigatório de compliance.

### Watch List
- Fornecedores de compliance NR-1 (NR Guard, Solides, Moodar, NR1PSICO) adicionando uma camada de cuidado individual sobre o relatório de risco que já vendem — eles já têm a relação institucional, a adjacência é natural e rápida.
- Zenklub (bem capitalizada, R$45 mi) lançando uma vertical específica para médicos ou para conformidade NR-1.
- Players internacionais de saúde mental com IA (Wysa e similares) localizando para o Brasil, atraídos pelo novo orçamento gerado pela NR-1.
- Confirmação de parceiro clínico (psicólogo) e de precificação do Zelo — enquanto essas duas peças (marcadas como "a definir" no `lean-canvas.md`) não fecharem, a comparação de preço com Zenklub/VITAL WorkLife continua hipotética.

## Fontes e Confiança

| Tipo de informação | Fonte | Confiança |
|---|---|---|
| Dados de produto/features (Physicians Anonymous, VITAL WorkLife) | Sites institucionais (physiciansanonymous.org, vitalworklife.com) | Média — sites próprios, sem verificação independente |
| Dados de produto/features (Wysa) | Fierce Healthcare, Behind Wellness, EMHIC, artigos acadêmicos (PMC) | Média-Alta — mistura de imprensa e literatura revisada por pares |
| Preço Zenklub | Página institucional (zenklub.com.br) + reportagens (Exame, Brazil Journal) | Média-Alta |
| Preço Vittude/Wellhub (mencionados no contexto, não em deep dive) | Sites institucionais + Brazil Journal, Gazeta do Povo | Média |
| NR-1 e software de compliance (NR Guard) | nrguard.com.br + artigos jurídicos/contábeis (Barbieri Advogados, Contabeis.com.br) | Média-Alta — múltiplas fontes convergentes sobre o prazo de maio/2026 |
| Dado "82% dos médicos com medo de consequências profissionais" | Sermo Barometer via Businesswire (press release) | Média — press release da própria Sermo, não paper revisado por pares |
| Preços do Zelo (nosso produto) | `lean-canvas.md` interno | Baixa — explicitamente marcado como "a definir" no próprio documento |
| Inferência estratégica (recomendações, mapa de posicionamento) | Análise própria a partir dos dados acima | Média — inferência qualitativa, não testada com clientes reais |

## Próximos Passos

- [ ] Validar com Dr. David Mendes (ou novos entrevistados) se ele já conhece/avaliou VITAL WorkLife, Zenklub ou soluções de compliance NR-1 no hospital onde atua.
- [ ] Testar o enquadramento "conformidade NR-1 que também cuida da equipe" em pelo menos uma conversa real com hospital/cooperativa antes do checkpoint de 18/07/2026.
- [ ] Levantar se algum concorrente de compliance NR-1 (NR Guard, Solides, Moodar) já anuncia parceria ou módulo de saúde mental individual — repetir esta busca a cada checkpoint, dado o ritmo acelerado da categoria.
- [ ] Assim que houver decisão de precificação (pendência aberta no `lean-canvas.md`), atualizar a tabela de Comparação de Preços com um benchmark real frente a Zenklub (~R$22-25/vida/mês).
- [ ] Confirmar com a equipe se "Physicians Anonymous" e "VITAL WorkLife" devem ser citados no pitch da final como prova de que o modelo de negócio (peer support / EAP específico de médico) já é validado em outro mercado — pode fortalecer a narrativa de tese para a banca.

---

*Análise válida a partir de 11/07/2026. Panorama competitivo muda rápido, especialmente na categoria de compliance NR-1 (múltiplos entrantes simultâneos) — recomenda-se repetir esta análise a cada checkpoint semanal da Jornada até a final (25/07/2026).*
