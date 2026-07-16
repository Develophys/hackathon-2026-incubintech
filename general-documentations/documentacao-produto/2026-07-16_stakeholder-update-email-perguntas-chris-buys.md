---
artifact_type: stakeholder-update
version: "1.0"
generated_at: 2026-07-16T00:00:00-03:00
generated_by_skill: foundation-stakeholder-update

meeting_title: "Perguntas por escrito para validação clínica — Chris Buys (psicólogo parceiro do Zelo)"
meeting_date: 2026-07-16

project: zelo
topics:
  - parceiro-psicologo
  - escalonamento-crise
  - validacao-clinica

channel: email
audience_variant: customer-facing
primary_cta: "Responder, no próprio ritmo e sem prazo fixo, priorizando os Blocos 1-3."

thread_continuation_of: "2026-07-11_stakeholder-update-email-mentoria-parceiro-psicologo.md"

related_recap: "raw input — não há recap de reunião; construído a partir de roteiro-entrevista-psicologos-parceiros.md, adaptado de formato de conversa ao vivo para formato assíncrono por escrito"

input_quality: medium
confidence: medium
visibility: public
status: draft
---

# Stakeholder update: Perguntas por escrito para Chris Buys — Zelo

## Shareable update

---

### Email variant

**Assunto**: Zelo — perguntas para sua validação clínica (sem correria, no seu ritmo)

Oi Chris,

Muito obrigado por topar apoiar o Zelo com seu olhar clínico! Como conversamos, em vez de marcarmos uma entrevista ao vivo, resolvi te mandar por escrito as perguntas que a gente gostaria da sua visão — assim você responde no seu tempo, da forma que for mais prática (texto, áudio, o que for melhor pra você).

**TL;DR**

- As perguntas estão organizadas em 8 blocos, do mais urgente (critérios de risco agudo) ao mais aberto (sua percepção livre sobre lacunas que a gente, sem formação clínica, pode não estar enxergando).
- Não tem prazo fixo nem preciso que você responda tudo de uma vez — mas se puder priorizar os **Blocos 1 a 3**, isso ajuda bastante, porque são os que travam decisões de produto que estamos implementando agora.
- Pode responder ponto a ponto, só nos blocos que fizerem mais sentido pra você, ou em texto corrido — o que for mais natural.

**Contexto rápido sobre o Zelo**

O Zelo é uma plataforma de triagem confidencial de burnout para médicos (projeto de um hackathon/pré-incubação, Incubintech). A ideia central: quando a autoavaliação do médico sinaliza risco, o app oferece — nunca impõe — uma conexão com um psicólogo parceiro humano, mantendo o anonimato em todo o resto do produto. É a parte do projeto mais ligada a risco de vida, e por isso a mais sensível a acertar.

---

**Bloco 1 — Critérios de risco agudo (o mais urgente pra gente)**

1. O item 9 do PHQ-9 (ideação suicida) sozinho já é gatilho suficiente para acionar o escalonamento de crise, ou você recomendaria sempre combinar com outro sinal (ex.: pontuação total alta, resposta ao GAD-7, dimensão de despersonalização do MBI-HSS)?
2. Existe um risco real de falso positivo (acionar a oferta de crise para alguém que não está em risco agudo) que possa gerar desconfiança ou desengajamento do médico? Como você equilibraria isso com o risco maior de falso negativo (não acionar quando deveria)?
3. Você toparia revisar e assinar (mesmo que informalmente, por escrito) a regra final de detecção de risco agudo, para o time poder apresentá-la como "critério validado por parceiro clínico" em vez de "regra hipotética do time"?
4. Existe algum sinal de risco que as escalas padrão (PHQ-9/GAD-7/MBI-HSS) não capturam bem para o perfil específico de médico plantonista/emergencista que você recomendaria observar?

**Bloco 2 — Escalas de autoavaliação (o que entra na demo)**

5. Dado que o prazo do projeto é curto, faz sentido clínico usar versões reduzidas de alguma dessas escalas, ou isso compromete a validade do instrumento a ponto de não valer a pena?
6. Se você tivesse que priorizar apenas uma ou duas escalas (não as três completas), qual combinação recomendaria para captar burnout com risco agudo embutido?
7. A autoavaliação precisa de algum aviso/contextualização clínica adicional, além do que já existe no fluxo, para não ser mal interpretada pelo próprio médico que responde?

**Bloco 3 — Protocolo de escalonamento (aceite/recusa)**

8. Qual o formato de primeiro contato mais adequado quando um médico aceita se identificar num momento de crise — mensagem assíncrona, chamada agendada, atendimento imediato? Hoje o produto assume "conexão ao vivo" via token efêmero; isso é realista com sua disponibilidade?
9. Existe uma linha de crise específica de apoio ao médico em Santa Catarina (além do CVV 188) que deveríamos referenciar no caminho de recusa?
10. Quando um médico recusa a conexão humana, existe algum protocolo mínimo de segurança que o produto deveria seguir além de mostrar a linha externa (ex.: reoferecer depois de um tempo, algum conteúdo específico)?
11. Do ponto de vista clínico, há algum problema em a oferta de conexão humana "poder reaparecer em interações futuras sem penalidade", mesmo após uma recusa?

**Bloco 4 — O chat de acolhimento por IA**

12. Que tipo de linguagem da IA você classificaria como "beirando diagnóstico", mesmo sem dizer explicitamente o nome de um transtorno? (isso ajuda a calibrar as regras internas do chat.)
13. O atalho "falar com uma pessoa real" (sempre visível, não só em risco agudo) deveria levar direto a um par médico, direto a um psicólogo, ou oferecer escolha ao usuário? Existe uma resposta clinicamente melhor, ou isso é mais preferência de produto?
14. Você vê algum risco em um médico usar o chat de IA como substituto prolongado de ajuda real, mesmo com os avisos atuais? O que tornaria esse risco mais visível pra gente?

**Bloco 5 — Matching anônimo de pares**

15. Conectar um médico em sofrimento a outro "par treinado" (não profissional de saúde mental) é clinicamente defensável como primeira camada de apoio, ou isso exige mais estrutura do que o produto tem hoje (ex.: triagem de quem pode ser "par")?
16. Que tipo de treinamento mínimo você recomendaria para alguém atuar como par, mesmo numa versão simples?

**Bloco 6 — Painel agregado (ética e re-identificação)**

17. O limiar mínimo de respostas por segmento hoje é uma hipótese (n=5). Do ponto de vista de ética/confidencialidade, esse número faz sentido para o contexto hospitalar, ou você recomendaria algo mais conservador?
18. Existe um risco ético de um gestor hospitalar, mesmo vendo só dados agregados, tomar decisões que prejudiquem indiretamente quem está mal (ex.: reduzir plantão de um setor inteiro por suspeita)? Isso deveria mudar como o painel comunica os dados?

**Bloco 7 — Fatores de risco que a gente pode não estar vendo**

Esse bloco é aberto de propósito — é exatamente o tipo de coisa que só o seu olhar clínico vai pegar.

19. Olhando o fluxo completo do produto (autoavaliação → chat → matching/crise → painel), o que salta aos seus olhos como uma lacuna de segurança clínica que a gente, sem formação em saúde mental, provavelmente não percebeu?
20. Existe algum padrão de risco específico da rotina de plantão/emergência (ex.: pós-plantão noturno, após óbito de paciente, após erro clínico) que o produto deveria tratar de forma diferente do fluxo genérico atual?
21. O produto promete nunca expor identidade sem consentimento explícito. Existe algum cenário em que essa promessa, mesmo bem-intencionada, poderia atrasar uma intervenção necessária?

**Bloco 8 — Formalização do seu papel**

Essa parte não é uma pergunta clínica, é mais sobre combinar expectativas.

22. Para efeitos da demo e do pitch, como você prefere ser descrito — "parceiro clínico consultado", "validador dos critérios de risco", algo mais formal? A gente não quer superdimensionar o vínculo além do que é real.
23. Você teria interesse em, no futuro (pré-incubação, pós-hackathon), assumir um papel mais operacional — por exemplo, atender de fato o caminho de aceite em crise? Ou seu apoio é estritamente consultivo por ora?
24. Existe alguma restrição ética/profissional (conselho de psicologia) que a gente precise saber antes de citar publicamente que você apoia o projeto?

---

Sem pressa nenhuma — qualquer coisa que você conseguir responder já ajuda bastante, e se alguma pergunta não fizer sentido do jeito que está formulada, me avisa que a gente ajusta. Fico à disposição pra qualquer dúvida antes de você responder.

Valeu, Chris!

[seu nome]

---

## Notas de tradução técnico → negócio

**Traduções aplicadas**:

- Pronome "vocês" (roteiro original, endereçado a dois psicólogos) → "você", já que este e-mail é individual para o Chris.
- "token de sessão efêmero" e "n=5" mantidos, pois são termos que o próprio roteiro já usava com os psicólogos e presumem-se compreensíveis nesse contexto técnico-clínico específico.
- Tom de "roteiro de conversa" (linguagem de facilitação de reunião) → tom de e-mail direto, com abertura, TL;DR e fechamento, adequado a leitura assíncrona.

**Sinalizado mas mantido** (pode precisar de revisão):

- Placeholder `[seu nome]` no fechamento — substitua pelo seu nome antes de enviar.
- Nenhum prazo fixo foi incluído, por decisão explícita do usuário (checkpoint de 18/07 estava a apenas 2 dias da data de redação deste e-mail, tornando um prazo rígido pouco realista para respostas escritas ponderadas).

---

## Fontes e Referências

### Entradas primárias

- `general-documentations/documentacao-produto/roteiro-entrevista-psicologos-parceiros.md` — roteiro original de entrevista ao vivo, base de todas as 24 perguntas.
- `general-documentations/documentacao-produto/2026-07-11_stakeholder-update-email-mentoria-parceiro-psicologo.md` — contexto do projeto Zelo e histórico da confirmação do parceiro clínico.

### Artefatos referenciados

- `general-documentations/documentacao-produto/prd.md` — FR-3, FR-4–FR-6b, FR-7–FR-10, "Dependências"
- `general-documentations/documentacao-produto/user-stories.md` — US-001 a US-006
- `general-documentations/documentacao-produto/problem-statement.md`
- `general-documentations/documentacao-produto/lean-canvas.md` — "Vantagem Injusta"

### Referências externas

- Nenhuma

### Contexto de geração

- **Gerado em**: 2026-07-16
- **Skill**: foundation-stakeholder-update, v1.1.0 (adaptado: fonte não é um recap de reunião, mas um roteiro de entrevista convertido para formato assíncrono)
- **Canal**: email
- **Variante de audiência**: customer-facing (parceiro clínico externo, individual)
- **Continuação de thread**: sim — dá sequência ao e-mail de 2026-07-11 que confirmou o apoio do Chris como parceiro psicólogo
- **Qualidade do input**: média — não há recap de reunião associado; construído a partir do roteiro de entrevista original, com decisões de escopo e prazo confirmadas diretamente pelo usuário (sem prazo fixo; todos os 8 blocos incluídos de uma vez)
- **Traduções aplicadas**: 3 — ver seção acima
