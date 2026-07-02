# Lean Canvas: Zelo* — Plataforma de Triagem e Suporte Confidencial à Saúde Mental do Médico

> **Criado**: 2026-07-02
> **Autor**: Equipe do desafio "Saúde do Médico" — 1ª Jornada Incubintech
> **Modo**: conteúdo
> **Confiança geral**: Média (baseado em dados públicos + brief do desafio; sem validação direta de clientes pagantes ainda)
> **Propósito**: formalização da tese já esboçada no pitch deck da equipe

`*Zelo é um nome de trabalho sugerido, ainda não validado (marca/domínio). Ajustar se o nome mudar.`

---

## 1. Problema

- **P1**: Médicos em sofrimento psíquico não têm canal confidencial para triagem e apoio sem medo de expor o registro no CRM.
- **P2**: Hospitais/cooperativas não têm visibilidade agregada e responsável do risco de burnout na equipe, sem violar a privacidade individual.
- **P3**: Iniciativas de bem-estar corporativo existentes são vistas como performáticas ou inseguras, gerando baixíssima adesão real.

### Alternativas Existentes

- Silêncio / normalização do sofrimento como "parte da profissão"
- Desabafo informal com colega de confiança, sem instrumento validado
- Terapia particular custeada do próprio bolso (baixa adesão por tempo/custo/estigma)
- Programas de EAP (Employee Assistance Program) genéricos, percebidos como ligados ao RH

**Confiança**: Alta
**Racional**: O brief do desafio e o pitch deck já descrevem esse cenário com base em dados publicados (CFM/AMB, 2022).

---

## 2. Segmentos de Clientes

Duas pontas distintas:
- **(a) Usuário final**: médicos(as) com CRM ativo em regime de alta carga assistencial em Santa Catarina.
- **(b) Cliente pagante**: hospitais, redes de saúde, cooperativas médicas (ex.: Unimed) e sindicatos médicos.

### Early Adopters

2 a 3 hospitais/cooperativas de porte médio em Santa Catarina, dispostos a rodar um piloto guiado pela pré-incubação da Incubintech.

**Confiança**: Média
**Racional**: Segmento pagante descrito no pitch deck, mas nenhum hospital piloto formalmente confirmado até o momento.

---

## 3. Proposta de Valor Única

Uma plataforma de saúde mental do médico em que o empregador paga pela ferramenta, mas nunca acessa o dado individual — apenas o médico decide, ativamente, se e quando sua identidade é exposta.

### Conceito de Alto Nível

"Seguro de responsabilidade civil, só que para o bem-estar da equipe médica" — ou, na linguagem do pitch: "o hospital paga, mas não vê o indivíduo."

**Confiança**: Média
**Racional**: Framing validado internamente no pitch deck; ainda não testado com um comprador real.

---

## 4. Solução

- **Para P1**: Autoavaliação clínica validada (PHQ-9, GAD-7, MBI-HSS) com score calculado no dispositivo + chat de acolhimento por IA (sem diagnóstico) + matching anônimo de pares + escalonamento opt-in em crise.
- **Para P2**: Painel de monitoramento com métricas agregadas e anônimas por turno/setor, nunca por indivíduo.
- **Para P3**: Arquitetura de privacidade verificável (client-side scoring, criptografia AES-256/E2E) como diferencial de confiança, não apenas política de privacidade em texto.

**Confiança**: Média
**Racional**: Solução tecnicamente descrita no pitch deck e no fluxo de crise de referência; ainda não testada com usuários reais.

---

## 5. Canais

### Compounding (gratuito, longo prazo)

- Parcerias com sindicatos médicos e associações de especialidade
- Conteúdo educativo sobre burnout médico
- Boca a boca entre médicos (adoção individual gratuita gera advocacia orgânica)

### Traction-demonstrating (pago, curto prazo)

- Apresentação direta a hospitais e cooperativas via ecossistema Incubintech/Sebrae Startups
- Participação em eventos do setor de saúde ocupacional

**Confiança**: Baixa
**Racional**: Nenhum canal testado ainda; hipóteses derivadas do ecossistema de apoiadores do edital.

---

## 6. Fontes de Receita

- **Modelo**: SaaS B2B por médico ativo/mês, em tiers (básico vs. institucional com painel)
- **Preço**: A definir — nenhum benchmark de mercado testado ainda (recomendado: pesquisa de precificação na pré-incubação)
- **Volume (Ano 1)**: A definir — placeholder até piloto com 2-3 hospitais
- **LTV**: A definir
- **Matemática**: preço x volume = receita (fórmula válida, sem valores confiáveis ainda)

**Confiança**: Baixa
**Racional**: Modelo de receita descrito qualitativamente no pitch deck; nenhum valor validado com clientes.

---

## 7. Estrutura de Custos

- **CAC**: A definir — hipótese: baixo no lado médico (aquisição orgânica/gratuita), mais alto no lado institucional (ciclo de vendas B2B mais longo)
- **Custos fixos**: Infraestrutura de nuvem (backend, banco de dados anonimizado), custo de API de LLM, eventual parceria remunerada com psicólogos
- **Custos variáveis**: Custo por chamada à API de LLM (por conversa de acolhimento); custo de sessões ao vivo com psicólogo parceiro no caminho de crise
- **Driver de custo**: Volume de conversas de IA e de escalonamentos em crise cresce com a base de médicos ativos

**Confiança**: Baixa
**Racional**: Estrutura qualitativa plausível; nenhum número validado.

---

## 8. Métricas-Chave

- % de autoavaliações concluídas sem abandono (meta a definir)
- % de sessões de chat que resultam em oferta de escalonamento aceita (taxa de opt-in)
- Nº de hospitais/cooperativas pagantes ativos
- Retenção de uso individual do médico ao longo de 3 meses
- Zero incidentes de exposição de identidade não consentida (métrica de integridade, não de crescimento)

**Confiança**: Média
**Racional**: Métricas derivadas diretamente da métrica de sucesso descrita no brief do desafio.

---

## 9. Vantagem Injusta

Pergunta em aberto. Ainda não há um fosso defensável comprovado. Candidato em exploração: a arquitetura de privacidade verificável (client-side scoring + E2E) combinada ao acesso ao ecossistema de pré-incubação da Incubintech (rede de hospitais parceiros, mentoria jurídica/LGPD, credibilidade institucional do IFSC) como vantagem de confiança difícil de replicar rapidamente por um concorrente genérico de bem-estar corporativo.

**Confiança**: Baixa

---

## Evidência & Confiança

### Validado

- Prevalência de burnout e baixa busca por ajuda entre médicos brasileiros (CFM/AMB, 2022, citado no brief e no pitch deck).

### Assumido

- Segmentos de cliente pagante, canais, preço, custo e vantagem competitiva — nenhum validado com dados primários.

### Perguntas em Aberto

- Qual tier de preço um hospital de médio porte em SC realmente pagaria por médico/mês?
- Existe já algum hospital disposto a testar antes da final da Jornada?
- Sindicatos médicos veem valor em endossar (não pagar) a ferramenta como canal de distribuição?

### Governança

- **Owner**: líder da equipe / PM do time
- **Cadência de revisão**: a cada checkpoint semanal da Jornada
- **Gatilhos de revisão**: qualquer conversa real com hospital ou médico que contradiga uma hipótese aqui marcada como "Assumido"
