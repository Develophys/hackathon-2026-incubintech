---
artefato: checkpoint-submission
versão: "0.1-rascunho"
criado: 2026-07-20
status: rascunho — pendências de conteúdo resolvidas; revisar antes de gerar o PDF final
---

# Zelo

## CHECKPOINT 3 — CONSOLIDAR, VALIDAR E APRESENTAR

**Equipe:** Zelo Labs
**Desafio:** Burnout Médico: A Dor de Quem Cuida dos Outros (1ª Jornada Incubintech 2026)
**Líder:** Maurício Alexandre Barroso | **Nº de integrantes:** 4 integrantes ativos (Raquel Ritter, Mauricio Alexandre, Yasmin, Kati)
**Situação no CP2:** Apta

---

## 1. Status do Protótipo "Pronto para Palco" (Entregável 1)

*(máx. 300 palavras)*

**Caminho Feliz:** o fluxo que vamos demonstrar ao vivo é o ciclo completo pedido pelo edital — **triagem → direcionamento → follow-up** — mais o diferencial do time. A médica abre o Zelo, faz um check-in de autoavaliação (PHQ-9 ou GAD-7, processado 100% no aparelho), vê o resultado, e a partir daí dois caminhos: em sinal leve/moderado, ela entra no chat de acolhimento por IA, onde o atalho "falar com uma pessoa real" está sempre visível e leva à escolha entre um par médico anônimo ou um psicólogo — é aqui que mostramos o **chat individualizado e anônimo entre pares**, nosso diferencial validado por entrevista real com médico usuário, e que nenhum concorrente direto oferece combinado com compliance NR-1. Em sinal de risco agudo, o app pergunta o vínculo (SUS ou plano de saúde/rede privada) e mostra o direcionamento certo, com a linha CVV 188 sempre visível. Por fim, o painel do gestor mostra as métricas agregadas e anônimas — incluindo a nova taxa de resposta do follow-up, item que a própria ACM apontou como critério de avaliação em resposta formal recebida em 19/07.

**Limitações Conhecidas:** o matching de pares usa perfis fictícios pré-cadastrados, rotulados como demo (curadoria real de pares é processo institucional pós-hackathon). O painel do gestor exibe dados agregados simulados, nunca dados reais de médicos — por desenho de privacidade, não por atraso. O direcionamento SUS/privado usa texto genérico enquanto aguardamos confirmação de canais específicos da ACM. MBI-HSS segue "em breve" (bloqueio de licenciamento Mind Garden, já mapeado desde o CP2). O follow-up é local ao aparelho e não recorrente nesta fase.

**Plano de Contingência:** vídeo gravado da demo completa, servindo de backup caso a internet ou o servidor falhem durante a apresentação ao vivo.

**Evidência Visual:** o app está publicado e acessível — qualquer pessoa da banca avaliadora pode testá-lo ao vivo, no próprio celular, em [zelo-dusky.vercel.app](https://zelo-dusky.vercel.app).

---

## 2. Validação da Proposta de Valor (Entregável 2)

*(máx. 600 palavras)*

**Feedback Qualitativo:** o Zelo está atualmente em teste com médicos amigos pessoais do time, usando o protótipo de verdade em ambiente real. Já recebemos o retorno de um médico testador com feedbacks concretos: os itens acionáveis foram mapeados no nosso backlog e alguns detalhes serão implementados ainda nesta fase; outros feedbacks apontam para novas features fora do escopo desta primeira entrega da PoC. Sobre usabilidade, esse médico e um pequeno grupo de colegas que também testaram relataram que a aplicação é fácil de usar, com navegação intuitiva, e destacaram que a privacidade evidenciada na experiência é um diferencial para engajamento, assim como alguns aspectos funcionais do produto.

Complementarmente, e de forma mais robusta, tivemos uma validação externa direta e por escrito nesta última semana: encaminhamos ao **demandante do desafio (ACM — Associação Catarinense de Medicina)** um conjunto de perguntas formais sobre protocolo de crise, escalas de triagem, KPIs prioritários e escopo da PoC. A resposta, recebida em 19/07/2026 (Dr. Marcello Alberton Herdt, Diretor de Inovação), confirmou que nossa arquitetura de triagem (GAD-2/PHQ-2 → GAD-7/PHQ-9) está alinhada ao que se espera, e que **o critério de avaliação da PoC é exatamente a robustez do fluxo triagem → direcionamento → follow-up** — o mesmo fluxo que já era nosso "caminho feliz" de demo.

**Ajuste de Rota:** essa resposta gerou mudanças reais e documentadas no produto ainda nesta semana (ADR registrada, ver `adr-003-crisis-protocol-rescope-peer-chat-differentiator.md`):
1. Simplificamos o protocolo de crise — de uma simulação de "conexão ao vivo" com psicólogo para uma tela que sinaliza o risco e direciona corretamente por vínculo (SUS vs. rede privada), já que a ACM confirmou que integração técnica direta não é esperada nesta fase.
2. Adicionamos a métrica de follow-up ao painel do gestor — um requisito que a ACM citou como prioritário e que não existia no nosso backlog até essa resposta.
3. **Mantivemos deliberadamente** o chat anônimo entre pares como diferencial de produto, mesmo não sendo um pedido da ACM — porque nasceu de uma entrevista real com médico usuário (nossa validação mais concreta do medo de falar com IA), e não custava reverter uma decisão já validada.

**Proposta de Valor Única:** "O Zelo é a única solução que une triagem clínica validada, um atalho sempre visível para falar com uma pessoa real — par médico anônimo ou psicólogo —, e um painel de gestão que transforma bem-estar em compliance NR-1 mensurável, sem que o time de gerência da equipe médica (o hospital contratante da aplicação) tenha acesso à identidade dos médicos, dando segurança e privacidade para eles."

---

## 4. Preparação da Equipe (Entregável 4)

*(máx. 150 palavras)*

**Divisão de Fala:** Mauricio e Raquel dividem os 4 minutos de apresentação.

**Ensaios:** já realizamos ensaios cronometrados, ajustados exatamente à janela do edital — 4 minutos de apresentação e 2 minutos de perguntas.

**Presença:** os 4 integrantes confirmam presença física na final do dia 25/07.

---

## Notas para quem for gerar o PDF final

- Trocar `Situação no CP2` se "Apta" não for o termo exato que a organização usou pra vocês (confirmar contra o resultado oficial do CP2, se já chegou).
- Entregável 3 (roteiro da apresentação) é um upload separado — rascunho em `checkpoint_3_zelo_roteiro_rascunho.md` nesta mesma pasta.
- Cabeçalho obrigatório (edital): repetir Desafio/Líder/Nº integrantes/Situação no topo da primeira página do PDF final.
