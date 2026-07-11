# Conjunto de OKRs: Zelo* — Desafio Saúde do Médico, 1ª Jornada Incubintech (28 dias)

`*Nome de trabalho, ainda não validado.`

## Contexto

- **Escopo**: iniciativa (protótipo/PoC de hackathon)
- **Ciclo**: 27/06/2026 – 25/07/2026 (28 dias corridos, 1ª Jornada Incubintech)
- **Nível**: equipe do desafio (mesmo nível do escopo)
- **Tipo de OKR**: committed (relacionado aos checkpoints eliminatórios, que não são opcionais) combinado com learning (hipóteses de produto ainda não validadas com usuários reais)
- **Sinal de time empoderado**: feature-team — a equipe executa contra critérios de avaliação definidos externamente pela organização (edital), não contra uma estratégia que ela mesma definiu livremente
- **Fonte de verdade**: backlog/board da equipe — **GitHub Projects** (decidido em 11/07/2026)
- **Input estratégico**: critérios de avaliação do edital (sustentabilidade, viabilidade técnica, criatividade/inovação, impacto social, viabilidade econômica, apresentação/clareza, escalabilidade) + métrica de sucesso do brief do desafio
- **Premissas**: haverá acesso a mentoria e a pelo menos uma referência clínica para validar critérios de risco; o provedor de LLM escolhido responde dentro de limites de latência aceitáveis para uso em chat

## Objetivo

Provar, com um protótipo funcional (TRL3), que é possível oferecer triagem e acolhimento confidencial ao médico em sofrimento psíquico sem jamais expor sua identidade sem consentimento — e levar essa prova até a final da 1ª Jornada Incubintech.

## Resultados-Chave (Key Results)

- **KR1**: Aprovar a equipe em 3 de 3 checkpoints eliminatórios do edital, de 0/3 (baseline) para 3/3, até 18/07/2026.
  - Métrica: número de checkpoints semanais aprovados pela organização
  - Baseline: 0/3, em 2026-07-02
  - Meta: 3/3 até 18/07/2026
  - Fonte de evidência: comunicação oficial da organização/mentoria da Jornada
  - Responsável: líder de equipe
  - Classe de indicador: leading
  - Confiança: média

- **KR2**: Demonstrar, na final, os quatro pilares do PoC (autoavaliação client-side, chat de acolhimento por IA, matching/escalonamento, painel agregado) funcionando ao vivo, sem qualquer exposição de identidade fora do consentimento explícito, com 0 incidentes.
  - Métrica: número de pilares funcionando na demo ao vivo (0-4) + número de incidentes de exposição indevida de identidade
  - Baseline: 0/4 pilares implementados; não há evidência suficiente para incidentes (produto ainda não existe)
  - Meta: 4/4 pilares + 0 incidentes, em 25/07/2026
  - Fonte de evidência: observação direta na demo + revisão técnica interna do time antes da final
  - Responsável: tech lead
  - Classe de indicador: lagging
  - Confiança: média

- **KR3**: Obter nota média igual ou superior a 4,0 (de 0 a 5) nos 7 critérios de avaliação da banca (edital, item 12.1).
  - Métrica: média aritmética das notas da banca nos 7 critérios (sustentabilidade, viabilidade técnica, criatividade/inovação, impacto social, viabilidade econômica, apresentação/clareza, escalabilidade)
  - Baseline: recomendado medir — não existe nota anterior; este é o primeiro ciclo de avaliação
  - Meta: ≥ 4,0 de média, em 25/07/2026
  - Fonte de evidência: ata/resultado oficial da banca avaliadora
  - Responsável: líder de equipe (responsável pelo pitch)
  - Classe de indicador: lagging
  - Confiança: baixa

## Iniciativas como Apostas

- **Iniciativa 1**: Implementar autoavaliação client-side (PHQ-9/GAD-7/MBI-HSS) com cálculo local e cifragem antes do envio de qualquer dado agregado.
  - Impacto esperado: KR1, KR2
  - Hipótese: sem esse pilar funcionando, nenhum checkpoint técnico é aprovado e o pilar de privacidade fica sem demonstração concreta.
  - Dependência: definição do subconjunto de escalas a implementar dentro do prazo; Web Crypto API no client.

- **Iniciativa 2**: Implementar chat de acolhimento por IA com guardrails contra diagnóstico, usando API de LLM de terceiro com anonimização prévia do texto.
  - Impacto esperado: KR2, KR3
  - Hipótese: um chat crível e sem alucinação de diagnóstico é o que mais impacta a nota de "criatividade e inovação" e "viabilidade técnica" da banca.
  - Dependência: escolha do provedor de LLM; validação do system prompt com mentor especializado.

- **Iniciativa 3**: Implementar o fluxo de escalonamento em crise (aceite/recusa) conforme o diagrama de referência.
  - Impacto esperado: KR2, KR3 (critério "impacto social")
  - Hipótese: esse é o pilar mais fortemente ligado ao critério de "impacto social" da banca, por lidar diretamente com risco de vida.
  - Dependência: confirmação (ou simulação documentada) de parceiro psicólogo.

- **Iniciativa 4**: Implementar matching anônimo de pares (mesmo que com dados simulados) e painel agregado institucional navegável.
  - Impacto esperado: KR2, KR3 (critérios "escalabilidade" e "viabilidade econômica")
  - Hipótese: o painel agregado é o que torna o modelo de negócio (quem paga) tangível para a banca, mesmo sem cliente pagante real ainda.
  - Dependência: dados simulados/anonimizados suficientes para popular o painel de forma convincente.

## Guardrails e Verificações de Saúde

- **Guardrail 1**: Zero incidentes de dado identificável em texto claro persistido no servidor, verificado por revisão técnica antes de cada checkpoint.
  - Por quê: esse é o núcleo da proposta de valor; uma falha aqui invalida o produto inteiro, independentemente de qualquer outra métrica de progresso.

- **Guardrail 2**: Nenhuma resposta do chat de IA deve conter linguagem que possa ser lida como diagnóstico clínico (revisão amostral manual a cada checkpoint).
  - Por quê: emitir diagnóstico automatizado é um não-objetivo explícito da PRD e um risco ético/legal para o produto.

- **Guardrail 3** *(adicionado 07/07/2026)*: O atalho "falar com uma pessoa real" (PRD FR-6b) deve estar visível em toda tela do chat de IA, verificado a cada checkpoint.
  - Por quê: a entrevista com Dr. David Mendes (02/07/2026) indicou que a desconfiança de IA em momentos de sofrimento é uma barreira de abandono tão crítica quanto o próprio anonimato — sem esse atalho, o produto corre risco de ser rejeitado no primeiro contato pelo próprio público que deveria atender.

## Notas de Alinhamento

- **Vínculo com estratégia**: Edital 1ª Jornada Incubintech — Método de Inovação Aberta (critérios de avaliação, item 12.1)
- **Dependências de pares**: mentoria da Incubintech (prototipagem, UX, negócio, pitch); eventual profissional designado pela organização demandante (edital, item 8.3)
- **Conflitos conhecidos**: nenhum time concorrente conhecido dentro do mesmo desafio até o momento
- **Fora do escopo deste ciclo**: validação clínica formal, precificação comercial fechada, integração com sistemas hospitalares — tratados como Considerações Futuras na PRD

## Divulgação

Este conjunto de OKRs enquadra entregas pré-definidas pelo edital (checkpoints, critérios da banca) como apostas de resultado. Se a nota da banca (KR3) não vier como esperado mesmo com os pilares tecnicamente entregues (KR2), isso é aprendizado sobre comunicação/pitch, não necessariamente falha de execução técnica. A alavanca do time neste ciclo é continuar entregando contra o escopo da PRD; a alavanca do OKR é realimentar o próximo ciclo (pós-hackathon/pré-incubação) com o que for aprendido.

## Auditoria de Qualidade

- Ajuste estratégico: pass — alinhado diretamente aos critérios de avaliação do edital
- Qualidade do objetivo: pass — direcional, sem métricas embutidas
- Qualidade dos KRs como resultado: risk — KR2 mistura contagem de entregáveis (mais próximo de output) com o resultado de "zero incidentes"; aceitável dado o contexto de hackathon, mas vale revisar
- Qualidade de mensuração: risk — KR3 não tem baseline real (primeiro ciclo de avaliação); marcado corretamente como "recomendado medir"
- Influência do produto: pass — a equipe controla diretamente as iniciativas que movem os KRs
- Foco: pass — 3 KRs, sem dispersão
- Guardrails: pass — dois guardrails de integridade definidos
- Alinhamento: pass — vínculo explícito ao edital
- Ritmo operacional: pass — cadência semanal já definida externamente pelos checkpoints
- Integridade: pass — nenhuma meta fabricada; baselines ausentes foram marcadas como tal, não inventadas
- Divulgação de time feature-team: pass — presente, pois o sinal é feature-team

## Perguntas em Aberto

1. ~~Qual ferramenta será a "fonte de verdade" do backlog da equipe?~~ — **Resolvido em 11/07/2026**: GitHub Projects.
2. As datas exatas dos 3 checkpoints semanais já foram publicadas pela organização, ou apenas o formato ("um por semana")? — **Confirmado pelo time em 07/07/2026**: 04/07, 11/07 e 18/07 (checkpoints) e 25/07 (final) permanecem válidas como planejamento interno. Ver `roadmap/README.md` para o detalhamento por pessoa.
3. ~~Existe algum piso mínimo de qualidade definido pela mentoria para considerar um checkpoint "aprovado"?~~ — **Resolvido em 11/07/2026**: segundo Mauricio, o que importa é o prazo e o projeto não fugir muito do que a documentação enviada no edital pede. Não há um piso de qualidade formal adicional conhecido além disso.

## Próximo Passo Sugerido

Confirmar com a mentoria da Jornada as datas exatas dos 3 checkpoints e o formato de entrega esperado em cada um, para transformar o KR1 em um cronograma interno com folga de segurança antes de cada data oficial.
