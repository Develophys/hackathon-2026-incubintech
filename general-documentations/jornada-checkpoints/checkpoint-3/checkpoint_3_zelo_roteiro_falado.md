---
artefato: pitch-script-falado
versão: "0.1-rascunho"
criado: 2026-07-20
status: rascunho — script de ensaio para Mauricio (apresentador solo), 4 min de fala + 2 min de perguntas
---

# Zelo — Roteiro falado para o pitch (4 minutos, solo)

`Texto pra falar em estilo normal, sem parênteses. [AÇÃO: ...] é o que fazer na demo enquanto fala. Marcações de tempo são acumuladas (0:00-0:30 = do início até 30s), pra você conferir no ensaio se está no ritmo certo.`

---

### 0:00 – 0:30 — Problema e Contexto

> Todo mundo aqui já ouviu falar de um médico que aguentou calado. Que não pediu ajuda porque tinha medo de que isso aparecesse no conselho, no CRM, na carreira dele. Isso não é exceção — é a regra. E desde maio deste ano, a NR-1 obrigou todo empregador a gerir esse risco psicossocial por lei. O problema deixou de ser só humano. Virou também regulatório. A pergunta que a gente se fez foi: como comunicar acolhimento de verdade num serviço novo, quando ninguém confia em serviço novo nenhum?

### 0:30 – 2:45 — Solução e Demo

> A resposta é o Zelo. Deixa eu mostrar.

`[AÇÃO: abrir o app na tela inicial]`

> Em menos de cinco minutos, a médica faz uma autoavaliação clínica validada — PHQ-9 ou GAD-7. E o primeiro compromisso do Zelo já aparece aqui: esse score é calculado inteiramente no aparelho dela. Nada de bruto sai daqui.

`[AÇÃO: completar/mostrar o resultado da autoavaliação]`

> A partir do resultado, dois caminhos. Se o sinal é leve ou moderado, ela entra no nosso chat de acolhimento por IA.

`[AÇÃO: abrir o chat]`

> E aqui está um detalhe que não é cosmético — esse atalho, "falar com uma pessoa real", fica sempre visível. Não só quando o sistema detecta risco. Isso veio de uma entrevista real com um médico usuário, que nos disse sem rodeios: no menor sinal de estar falando com uma IA, ele abandona a conversa. Então, a qualquer momento, ela pode escolher falar com um par médico anônimo — outro médico, sem troca de identidade nenhuma — ou com um psicólogo.

`[AÇÃO: mostrar o atalho / tela de pares anônimos]`

> Esse chat entre pares é o nosso maior diferencial, e eu volto nele já já.

> Agora, se o sinal é de risco agudo, o Zelo não finge que consegue te conectar ao vivo com um psicólogo de plantão. A gente pergunta uma coisa simples: você é atendido pelo SUS, ou tem plano de saúde?

`[AÇÃO: abrir a tela de crise, escolher um vínculo]`

> E direciona pro canal certo, na hora — com a linha do CVV sempre visível, sem exceção, sem depender de escolha nenhuma.

> Por fim, o hospital que paga a conta enxerga isso.

`[AÇÃO: abrir o painel do gestor]`

> Um painel agregado, anônimo, com limiar mínimo de amostra pra nunca reidentificar ninguém. E olha esse número aqui — taxa de resposta do nosso follow-up. Isso não estava no nosso produto há uma semana. Foi a própria organização que propôs esse desafio que nos disse, por escrito, que esse era o critério real de avaliação: triagem, direcionamento, e follow-up. A gente ouviu, e entregou em poucos dias.

### 2:45 – 3:25 — Diferencial

> Por que isso importa mais do que parece? Porque hoje, quem faz compliance de NR-1 no Brasil não cuida de gente. E quem cuida de médico lá fora não é NR-1, nem fala português, nem entende o medo do CRM. O Zelo é o único que junta as duas pontas: cuidado individual de verdade, com uma arquitetura de privacidade que é restrição técnica, não promessa em contrato — e um painel que transforma isso em instrumento de conformidade legal mensurável pro hospital.

### 3:25 – 3:45 — Impacto Esperado

> O impacto social é direto: menos médico sofrendo calado, menos erro clínico evitável. O impacto econômico a gente ainda está fechando o número exato — mas o mercado já paga por menos do que isso, hoje, na faixa de vinte e poucos reais por vida por mês. A nossa proposta é competitiva nessa faixa, com muito mais entregue.

### 3:45 – 4:00 — Equipe e Próximos Passos

> Esse trabalho é de quatro pessoas — eu cuido de arquitetura e produto, e o time de dados e marketing por trás fecha o resto. Próximo passo imediato: validação clínica formal e o piloto real que já está rodando com médicos de verdade agora. Obrigado.

---

## Cola rápida para as perguntas (2 min)

Perguntas prováveis, com resposta curta pronta — não precisa decorar, só ter a ideia na ponta da língua:

- **"O painel do gestor usa dado real de médico?"** → Não, por desenho. Dado real é criptografado ponta a ponta e estruturalmente não pode alimentar esse painel — o painel usa dado agregado simulado, documentado como tal.
- **"O matching de pares é real?"** → Nesta fase, são perfis fictícios pré-cadastrados, rotulados como demo. A curadoria real de pares treinados é processo institucional, fora do escopo técnico dos 28 dias.
- **"Por que não conectar ao vivo com psicólogo no risco agudo?"** → Foi decisão consciente depois da resposta formal da própria ACM: o que se espera nessa fase é sinalização e direcionamento certo, não integração técnica com serviços de emergência.
- **"Quanto vocês cobram?"** → Faixa hipótese de R$15-20 por médico/mês, abaixo do benchmark de mercado (Zenklub, ~R$22-25/vida/mês), ainda a validar comercialmente.
- **"Isso é válido clinicamente?"** → As escalas (PHQ-9, GAD-7) são padrão internacional, aplicadas sem alteração. A regra de risco agudo e o modelo de triagem em duas etapas foram confirmados por escrito pela ACM; validação clínica formal com comitê de ética é o próximo passo pós-hackathon.

---

## Como ensaiar isso

1. Leia em voz alta cronometrando cada bloco (não o texto todo de uma vez) — se um bloco estourar o tempo marcado, corte frase, não corte ação de demo.
2. Ensaie com o app de verdade aberto, não só lendo o texto — a troca de tela é o que mais desvia do tempo.
3. Se sobrar tempo no ensaio, é melhor guardar silêncio de 2-3 segundos entre blocos do que adicionar mais texto.
