---
artifact: interview-synthesis
version: "1.0"
created: 2026-07-11
status: draft — case brief de participante único (n=1), não é síntese de padrões
---

# Case Brief de Entrevista: Dr. David Mendes (ENT-01)

> **Aviso de escopo.** Este documento **não é uma síntese de padrões** no sentido pleno do termo — isso exigiria evidência convergente de pelo menos 3 participantes (ver `discover-interview-synthesis`). Até o momento a equipe realizou **uma única entrevista de usuário**. O que segue é um *case brief* honestamente escopado a n=1: perfil do participante, observações diretas, citações e hipóteses preliminares a validar. Nenhuma afirmação aqui deve ser lida como "os médicos pensam X" — leia-se sempre "este médico, nesta entrevista, disse X".
>
> As próximas entrevistas (equipe de PS/UTI do próprio Dr. David Mendes, oferecidas por ele) são o próximo passo natural para transformar este case brief em síntese real. Ver [reuniao_07_10.md](../reuniao_07_10.md), item 10 ("Follow-up de pesquisa").

## Visão Geral da Pesquisa

### Objetivo
Entender a rotina, as fontes de pressão emocional e os critérios de confiança de um médico gestor em relação a uma plataforma digital confidencial de triagem e suporte à saúde mental, para informar o desenho do produto (Zelo*) antes do Checkpoint 2 da Jornada Incubintech.

### Metodologia
- **Formato:** Videochamada (Google Meet), gravada e transcrita automaticamente (Gemini)
- **Duração:** ~33 minutos (00:02:53 a 00:30:48 de conteúdo substantivo)
- **Entrevistadora:** Raquel Ritter
- **Data:** 2026-07-02
- **Fonte bruta:** `general-documentations/07_07_docs/Entrevista com Dr. David Mendes - 2026_07_02 19_25 GMT-03_00 - Anotações do Gemini.docx`

### Perfil do Participante

| Campo | Detalhe |
| --- | --- |
| ID | ENT-01 / P1 |
| Papel atual | Gestor médico — responsável técnico por unidade de saúde SUS de baixa/média complexidade (PS); atua também 1-2x/semana em UTI de hospital particular |
| Perfil assistencial | **Atípico como usuário-alvo primário**: hoje atua predominantemente em gestão de pessoas/burocracia, não em assistência direta — ele próprio sinalizou isso ("minha contribuição pode ser um pouco diferente de outros médicos que trabalham mais na assistência") |
| Contexto institucional | SUS (unidade mista/baixa complexidade, alta demanda) + rede privada (UTI, recursos mais amplos) |
| Relação com terapia | Já faz psicoterapia regularmente (mencionou ter sessão logo após a entrevista) — não representa o médico que nunca buscou ajuda |
| Papel na pesquisa | Também é ponte para acesso à equipe médica dele (PS/UTI) para entrevistas futuras |

**Por que isso importa:** a persona-alvo do produto ([persona.md](persona.md)) é a médica plantonista assistencial em sofrimento silencioso — o entrevistado é gestor, não plantonista, e já tem rede de apoio terapêutica ativa. As respostas dele são informativas sobre **cultura e barreiras estruturais da classe médica**, mas precisam ser triangulados com médicos assistenciais de plantão (o público-alvo real) antes de virar decisão de produto.

---

## Observações por Tópico

*(Sem "prevalência" — cada observação é de um único participante. Marcação de confiança substitui a prevalência do template padrão.)*

### Tópico 1: Rotina e fontes de tensão emocional

**Observação:** O maior pico de tensão diário não vem do atendimento clínico em si, mas da responsabilidade técnica por decisões de outros médicos (reunião das 11h) e, de forma ainda mais intensa, de demandas jurídicas da Secretaria da Saúde decorrentes de processos por óbito ou insatisfação de pacientes — mesmo quando ele discorda tecnicamente da conduta que precisa defender.

**Evidência:**
> "é a hora que eu saio chorando pra regulação municipal para nos ajudar" — David Mendes, sobre a rotina de coordenar exames/transferências

> "eu tenho que sentar e escrever um ofício com termos técnicos [...] tentando defender a unidade [...] muitas vezes eu não vejo como defender [...] mas eu tenho que defender porque é quem paga meus salários" — David Mendes, sobre demandas jurídicas

**Confiança:** Alta para este indivíduo (relato direto, consistente ao longo da entrevista). Generalização: baixa — é um tipo de tensão específico de cargo de gestão/responsabilidade técnica, não necessariamente do plantonista assistencial.

### Tópico 2: Cultura de estigma e "workaholismo"

**Observação:** Barreira dupla para buscar ajuda — (1) estigma da autossuficiência ("ser médico, eu meio que sei") e (2) valorização cultural do excesso de trabalho, em que buscar ajuda formal tende a implicar redução de carga horária, algo mal visto na classe. O comportamento típico observado é automedicação (antidepressivo autoprescrito) ou atestado/afastamento breve, não busca formal de ajuda.

**Evidência:**
> "Geralmente ele se autoprescreve um antidepressivo [...] ou ela apresenta um atestado na empresa, fica fora uns dias e depois volta normal" — David Mendes

> "é muito valorizado no meio médico [...] a ponto de às vezes até eu mesmo me perceber me sobrecarregando de trabalho sem necessidade [...] é esperado da gente trabalhar em três, quatro lugares" — David Mendes

> "procurar ajuda de saúde mental invariavelmente leva a reduzir volume de trabalho. E eu acho que no meio médico isso é problemático, abrir mão de trabalho" — David Mendes

**Confiança:** Alta relevância direta para a tese do produto (item já registrado no problem-statement/lean-canvas do time). Como observação de n=1 vindo de alguém que já supera parte desse estigma (faz terapia), há risco de viés: ele pode estar descrevendo o estigma *dos outros* de forma mais lúcida do que alguém ainda dentro dele descreveria a própria experiência.

### Tópico 3: Ambiente institucional não é propício ao cuidado

**Observação:** Ele não considera o ambiente de trabalho propício à saúde mental do colaborador — cita caso concreto de tentativa de suicídio na própria unidade. Normas existem no papel (ele cita a NR32 ao invés da NR-1, ver nota de verificação abaixo) mas não se concretizam por falta de tempo e por não haver reconhecimento institucional da sobrecarga; o cuidado, quando acontece, parte de gestores de nível mais baixo, não de decisão institucional de cima.

**Evidência:**
> "não acho que seja um ambiente propício à atenção de saúde mental do colaborador [...] a gente já teve funcionário que tentou suicídio dentro da própria unidade" — David Mendes

> "às vezes é muito mais uma questão de quem tá mais embaixo na escala de gestão [...] de abordar um colaborador do que realmente alguém lá de cima nos dizer 'tenho que cuidar'" — David Mendes

**Nota de verificação para o time:** o entrevistado menciona "NR32" como a norma que trataria de bem-estar/saúde mental, mas a pergunta de alinhamento que a equipe preparou para a organização do desafio ([reuniao_07_10.md](../reuniao_07_10.md), item 5) refere-se à **NR-1** (gestão de riscos psicossociais, atualizada em 2024). NR-32 trata de segurança em serviços de saúde (biossegurança) — o exemplo que ele deu (cabelo preso, calçado fechado) é de fato NR-32, mas a extensão dele para "norma de saúde mental" pode ser uma imprecisão de memória do entrevistado, não um dado a citar como se fosse preciso. Vale confirmar a tese de NR-1 diretamente com a organização do desafio antes de usar isso como argumento de venda.

### Tópico 4: Confiança em uma plataforma digital de suporte

**Observação:** O fator decisivo de confiança **não é anonimato/sigilo** (ele disse explicitamente que nem se preocuparia com isso) — é a certeza de estar falando com uma pessoa real, não uma IA, em momentos de sofrimento. Rejeição forte e imediata a qualquer sinal de que está falando com um robô. Dois fatores adicionais de desconfiança: alta rotatividade de quem atende (obrigaria reviver o relato) e falta de entendimento de contexto clínico/profissional por parte de quem atende.

**Evidência:**
> "Eu acho que o que me faria confiar numa plataforma dessas [...] eu nem me preocuparia com questão de anonimato ou sigilo. Eu me preocuparia de ser alguém de verdade e não uma IA [...] no menor sinal de que essa pessoa [...] parecesse ser uma IA, eu ia desconfiar" — David Mendes

> "a rotatividade da pessoa que atende também é uma coisa que me deixaria inseguro [...] ter que repetir, reviver muita coisa desnecessariamente" — David Mendes

> "[desconfiaria se] a pessoa do outro lado não conseguir ter um mínimo entendimento do contexto em que eu tô inserido [...] 'mas por que que tu não muda de emprego?'" — David Mendes

**Confiança:** Alta relevância direta de produto — contradiz (ou pelo menos tensiona) a arquitetura atual do Zelo, que depende de "chat de acolhimento por IA" como primeira camada. Ver Insight 1 abaixo.

### Tópico 5: Onde a IA *é* aceitável

**Observação:** Importante contraponto ao Tópico 4 — ele aceita e até valoriza IA na **triagem inicial simples/estruturada** (ex.: escolher uma opção de menu que descreve a situação), desde que a interação seja humanizada no tom e não pareça um fluxo automatizado genérico/burocrático de erro. A rejeição é mais forte para conversas de acolhimento profundo, não para o primeiro toque.

**Evidência:**
> "sendo alguma coisa minimamente mais humanizada [...] nesses casos até eu acho que uma IA caberia [...] pode te dar um contexto maior [antes de passar para humano]" — David Mendes, sobre o primeiro contato

> "eu ia desistir na hora [...] quando aparecesse uma mensagem automática [...] 'ops, não entendi, pode repetir'" — David Mendes, sobre o que o afastaria

### Tópico 6: Quem deveria prestar o suporte

**Observação:** Preferência por falar com outro médico em vez de psicólogo, por confiança e "corporativismo" — mas reconhece psicólogo como opção válida. Isso reforça a hipótese de matching de pares já presente na tese do produto, mas vindo de uma única fonte.

**Evidência:**
> "a maior parte dos médicos se sentiria minimamente mais confortável de falar com outro médico por questão de confiança, até de certa forma corporativismo" — David Mendes

### Tópico 7: Gatilhos de uso e retenção

**Observação:** Uso mais provável durante situação de crise no trabalho (não necessariamente em casa); para engajamento de longo prazo, o fator é perceber benefício real e mensurável para a própria saúde mental — cita como referências concretas os apps "Cogni" (humor/pensamentos + pedir ajuda) e "I Am" (afirmações).

**Evidência:**
> "durante o trabalho, às vezes em uma situação de crise [...] é mais fácil a gente perceber o problema quando tá lá na hora" — David Mendes

> "[o que faria continuar usando] acho que perceber benefícios [...] para minha saúde mental" — David Mendes

### Tópico 8: Sinais de alerta auto-relatados

**Observação:** Vontade de desistir e falta de paciência foram os sinais que ele próprio validou como indicativos de exaustão, quando a entrevistadora sugeriu uma lista.

**Nota metodológica:** pergunta com opções sugeridas pela entrevistadora (lista fechada), não resposta espontânea — tratar como confirmação fraca, não como sinal descoberto organicamente.

---

## Citações Notáveis

> "acho que eu posso resumir a saúde mental da minha equipe como frágil e subestimada." — David Mendes

> "eu acho que existe um mix de menosprezar a própria saúde mental [...] com também uma questão de que é muito valorizado no meio médico ser workaholic." — David Mendes

> "Eu me preocuparia de ser alguém de verdade e não uma IA [...] no menor sinal [...] eu ia desconfiar." — David Mendes

> "se eu percebesse que não é algo que tem uma abertura mínima [...] eu ia desistir na hora." — David Mendes, sobre fluxos robóticos/automatizados

> "honestamente, o que eu acho que eu faria era regulamentar." — David Mendes, quando perguntado o que mudaria na forma como a saúde mental dos médicos é tratada hoje

---

## Hipóteses Preliminares (não "Insights" — pendem validação com mais participantes)

### Hipótese 1: A camada de IA precisa ser explicitamente limitada e sinalizada, não maximizada

Se a rejeição a IA em momentos de sofrimento real se confirmar em mais entrevistas, o desenho atual (IA como acolhimento inicial) precisa deixar muito claro, desde o primeiro contato, que existe uma saída rápida e visível para uma pessoa real — e evitar qualquer sinal de "robótico" (menus genéricos, respostas de erro automatizadas) mesmo na camada de IA. A tolerância a IA parece maior para *triagem estruturada* (ex.: PHQ-9/GAD-7 respondido em formulário) do que para *acolhimento em crise*.

**Implicação para o produto:** revisar o fluxo de crise do Caminho B (`fluxo-escalonamento-crise.pdf`) para confirmar que o atalho para pessoa real aparece antes do usuário perceber "estou conversando com um robô" — não apenas depois de um sinal de risco automático detectado.

**Confiança:** Baixa-média (n=1, mas já parcialmente incorporada em [persona.md](persona.md) linha 33 como regra de design).

### Hipótese 2: O argumento de venda institucional pode se apoiar mais em "reconhecimento da sobrecarga" do que em compliance puro

A frustração relatada não é ausência de norma, é ausência de *tempo reconhecido institucionalmente* para tratar do tema. Isso sugere que a tese comercial "instrumento de conformidade legal" (NR-1) pode precisar de um segundo argumento complementar: dar à gestão um dado agregado que force o reconhecimento formal da sobrecarga, não apenas uma checkbox de compliance.

**Confiança:** Baixa (inferência de um único relato de gestor, não de um comprador institucional real).

### Hipótese 3: A persona atual pode estar buscando o público errado para validar as hipóteses centrais

Como o próprio entrevistado sinalizou, ele não é o usuário assistencial-alvo. As hipóteses 1 e 2 acima vêm de alguém que já é gestor e já faz terapia — o médico plantonista em sofrimento silencioso e sem rede de apoio (a persona real) pode responder de forma bem diferente sobre IA, estigma e gatilhos de uso.

**Confiança:** Esta é a hipótese mais segura do documento — é sobre o método, não sobre o conteúdo.

---

## Recomendações

| Prioridade | Ação | Hipótese relacionada | Confiança |
| --- | --- | --- | --- |
| 1 | Agendar as entrevistas com a equipe de PS/UTI do Dr. David Mendes (oferta já feita por ele) antes de travar decisões de fluxo de IA | H3 | Alta — é pré-requisito para validar tudo o resto |
| 2 | Revisar o fluxo de crise para garantir saída visível e imediata para pessoa real, evitando qualquer padrão de menu robótico no primeiro contato | H1 | Média |
| 3 | Confirmar com a organização do desafio se a tese de compliance é NR-1 ou NR-32 antes de usar isso em material de pitch (ver [reuniao_07_10.md](../reuniao_07_10.md) item 5) | Tópico 3 | Alta (é uma verificação factual, não uma inferência) |
| 4 | Ao entrevistar médicos assistenciais (não-gestores), perguntar explicitamente sobre tolerância a IA em triagem estruturada vs. acolhimento em crise, para testar se a distinção do Tópico 5 se repete | H1 | Média |

---

## Apêndice

### Limitações

- **n=1.** Nenhuma afirmação neste documento é um "padrão" — é uma leitura de uma única conversa.
- **Viés de papel:** o entrevistado é gestor médico com responsabilidade técnica e jurídica, não plantonista assistencial — o público-alvo declarado da persona primária do produto.
- **Viés de rede de apoio:** já está em psicoterapia ativa; pode descrever o estigma de forma mais lúcida (por já estar parcialmente fora dele) do que alguém ainda evitando ajuda o descreveria.
- **Pergunta fechada em sinais de alerta:** a lista de sintomas (irritabilidade, insônia, falta de paciência) foi sugerida pela entrevistadora, não espontânea — tratar a confirmação como fraca.
- **Imprecisão factual não verificada:** menção à "NR32" como norma de bem-estar mental provavelmente deveria ser NR-1; não corrigido durante a entrevista, listado aqui para não propagar o erro em outros documentos.
- **Áreas não exploradas:** custo/acesso a terapia privada como barreira (mencionado de passagem, não aprofundado); diferenças entre médicos SUS vs. rede privada quanto à cultura de burnout; papel do CRM/registro profissional como medo concreto (mencionado pela entrevistadora, não confirmado nem negado claramente pelo entrevistado).

### Notas Brutas

Transcrição completa em `general-documentations/07_07_docs/Entrevista com Dr. David Mendes - 2026_07_02 19_25 GMT-03_00 - Anotações do Gemini.docx`. Ver também referência cruzada já registrada em [persona.md](persona.md), seção "Evidência & Confiança", fonte ENT-01.
