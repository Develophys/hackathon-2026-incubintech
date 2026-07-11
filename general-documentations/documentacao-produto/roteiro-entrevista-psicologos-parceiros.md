---
artefato: roteiro-entrevista
versão: "1.0"
criado: 2026-07-11
status: rascunho
---

# Roteiro de conversa — psicólogos parceiros (feedback e parametrização de risco)

**Contexto:** dois psicólogos confirmaram apoio ao Zelo, a princípio para dar feedback sobre a
proposta da aplicação e ajudar a parametrizar fatores de risco que o time pode não estar
enxergando. Este roteiro organiza as perguntas por bloco de decisão de produto — cada bloco
existe porque há uma pendência real documentada (PRD, user stories, problem statement) que
depende de olhar clínico para ser fechada.

**Como usar:** não precisa esgotar tudo numa única conversa. Priorize os Blocos 1–3 primeiro —
são os que bloqueiam decisões de implementação já em andamento (Semana 2, até 18/07). Os Blocos
4–8 podem ficar para uma segunda conversa.

**O que fazer com as respostas:** cada bloco indica onde a resposta deve ser registrada
(qual documento/FR/US atualizar) — não deixe a resposta só na ata da conversa.

---

## Bloco 1 — Critérios de risco agudo (o mais urgente)

*Onde isso se conecta:* PRD FR-3 e "Dependências" ("critério a definir com parceiro clínico");
`problem-statement.md`, pergunta em aberto "Existe algum psicólogo... disposto a validar os
critérios de risco agudo (ex.: item 9 do PHQ-9)?".

1. O item 9 do PHQ-9 (ideação suicida) sozinho é um gatilho suficiente para acionar o
   escalonamento de crise, ou deveria sempre ser combinado com outro sinal (ex.: pontuação
   total alta, resposta ao GAD-7, dimensão de despersonalização do MBI-HSS)?
2. Existe um risco real de falso positivo (acionar a oferta de crise para alguém que não está
   em risco agudo) que possa gerar desconfiança ou desengajamento do médico? Como equilibrar
   isso com o risco maior de falso negativo (não acionar quando deveria)?
3. Vocês toparim revisar e assinar (mesmo que informalmente, por escrito) a regra final de
   detecção de risco agudo antes do checkpoint de 18/07, para o time poder apresentá-la à banca
   como "critério validado por parceiro clínico" em vez de "regra hipotética do time"?
4. Existe algum sinal de risco que as escalas padrão (PHQ-9/GAD-7/MBI-HSS) não capturam bem
   para o perfil específico de médico plantonista/emergencista que vocês recomendariam
   observar?

---

## Bloco 2 — Escalas de autoavaliação (o que entra na demo)

*Onde isso se conecta:* `user-stories.md`, US-001, pergunta em aberto "Qual subconjunto exato
de escalas (PHQ-9 + GAD-7 + MBI-HSS completos ou reduzidos) cabe no prazo de 28 dias?".

5. Dado que o prazo é curto, faz sentido clínico usar versões reduzidas de alguma dessas
   escalas, ou isso compromete a validade do instrumento a ponto de não valer a pena?
6. Se tivesse que priorizar apenas uma ou duas escalas para o PoC (não as três completas), qual
   combinação vocês recomendariam para captar burnout com risco agudo embutido?
7. A autoavaliação precisa de algum aviso/contextualização clínica adicional além do que já
   está no fluxo (ver `06-assessment-question.md`, `07-result.md`) para não ser mal interpretada
   pelo próprio médico que responde?

---

## Bloco 3 — Protocolo de escalonamento (aceite/recusa)

*Onde isso se conecta:* PRD FR-7 a FR-10; `user-stories.md` US-003/US-004.

8. Qual o formato de primeiro contato mais adequado quando um médico aceita se identificar em
   um momento de crise — mensagem assíncrona, chamada agendada, atendimento imediato? O produto
   hoje assume "conexão ao vivo" via token efêmero; isso é realista com a disponibilidade de
   vocês?
9. Existe uma linha de crise específica de apoio ao médico em Santa Catarina (além do CVV 188)
   que deveríamos referenciar no caminho de recusa? (`problem-statement.md` e US-004 têm essa
   pergunta em aberto.)
10. Quando um médico recusa a conexão humana, existe algum protocolo mínimo de segurança que o
    produto deveria seguir além de mostrar a linha externa (ex.: reoferecer em X tempo, algum
    conteúdo específico)?
11. Do ponto de vista clínico, algum problema em a oferta de conexão humana "poder reaparecer em
    interações futuras sem penalidade" (FR-10), mesmo após uma recusa?

---

## Bloco 4 — O chat de acolhimento por IA

*Onde isso se conecta:* PRD FR-4, FR-5, FR-6, FR-6b; `user-stories.md` US-002.

12. Que tipo de linguagem da IA vocês classificariam como "beirando diagnóstico", mesmo sem
    dizer explicitamente um nome de transtorno? (isso ajuda a calibrar o guardrail do system
    prompt.)
13. O atalho "falar com uma pessoa real" (sempre visível, não só em risco agudo) deveria levar
    direto a um par médico, direto a um psicólogo, ou oferecer escolha ao usuário? Existe uma
    resposta clinicamente melhor, ou isso é preferência de produto?
14. Vocês veem algum risco em um médico usar o chat de IA como substituto prolongado de ajuda
    real, mesmo com os disclaimers atuais? O que tornaria esse risco mais visível ao time?

---

## Bloco 5 — Matching anônimo de pares

*Onde isso se conecta:* `user-stories.md` US-005.

15. Conectar um médico em sofrimento a outro "par treinado" (não profissional de saúde mental)
    é clinicamente defensável como primeira camada de apoio, ou isso exige mais estrutura do
    que o produto tem hoje (ex.: triagem de quem pode ser "par")?
16. Que tipo de treinamento mínimo vocês recomendariam para alguém atuar como par, mesmo numa
    versão simples?

---

## Bloco 6 — Painel agregado (ética e re-identificação)

*Onde isso se conecta:* `user-stories.md` US-006; painel do gestor, regra de k-anonimato.

17. O limiar mínimo de respostas por segmento hoje é uma hipótese (n=5). Do ponto de vista de
    ética/confidencialidade, esse número faz sentido para o contexto hospitalar, ou vocês
    recomendariam algo mais conservador?
18. Existe um risco ético de um gestor hospitalar, mesmo vendo só dados agregados, tomar
    decisões que prejudiquem indiretamente quem está mal (ex.: reduzir plantão de um setor
    inteiro por suspeita)? Isso deveria mudar como o painel comunica os dados?

---

## Bloco 7 — Fatores de risco que o time pode não estar vendo

*Este bloco é aberto de propósito — é o que vocês descreveram como "nos ajudar a
parametrizar fatores de risco que talvez não estejamos enxergando".*

19. Olhando o fluxo completo do produto (autoavaliação → chat → matching/crise → painel), o que
    salta aos olhos de vocês como uma lacuna de segurança clínica que o time, sem formação em
    saúde mental, provavelmente não percebeu?
20. Existe algum padrão de risco específico da rotina de plantão/emergência (ex.: pós-plantão
    noturno, após óbito de paciente, após erro clínico) que o produto deveria tratar de forma
    diferente do fluxo genérico atual?
21. O produto promete nunca expor identidade sem consentimento explícito. Existe algum cenário
    em que essa promessa, mesmo bem-intencionada, poderia atrasar uma intervenção necessária?

---

## Bloco 8 — Formalização do papel de vocês

*Isso não é uma pergunta clínica, é uma pergunta de escopo/relacionamento — mas precisa de
resposta para o time saber o que pode prometer à banca.*

22. Para efeitos da demo e do pitch, como vocês preferem ser descritos — "parceiros clínicos
    consultados", "validadores dos critérios de risco", algo mais formal? O time não quer
    superdimensionar o vínculo além do que é real.
23. Existe interesse de vocês em, no futuro (pré-incubação, pós-hackathon), assumir um papel
    mais operacional — por exemplo, atender de fato o caminho de aceite em crise? Ou o apoio de
    vocês é estritamente consultivo por ora?
24. Há alguma restrição ética/profissional (conselho de psicologia) que o time precise saber
    antes de citar publicamente que "psicólogos parceiros" apoiam o projeto?

---

## Onde registrar as respostas

| Bloco | Documento a atualizar |
|---|---|
| 1 (risco agudo) | `prd.md` FR-3, "Dependências"; `problem-statement.md` |
| 2 (escalas) | `user-stories.md` US-001 |
| 3 (escalonamento) | `prd.md` FR-7–FR-10; `user-stories.md` US-003/US-004 |
| 4 (chat de IA) | `prd.md` FR-4–FR-6b; `user-stories.md` US-002 |
| 5 (matching) | `user-stories.md` US-005 |
| 6 (painel) | `user-stories.md` US-006; `docs/superpowers/specs/screens/13-manager.md` |
| 7 (lacunas) | Provavelmente vira nota nova em `problem-statement.md` ou `prd.md`, "Riscos" |
| 8 (formalização) | `lean-canvas.md` ("Vantagem Injusta"); roteiro do pitch (Raquel) |
