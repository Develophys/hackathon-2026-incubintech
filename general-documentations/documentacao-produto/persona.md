# Dra. Camila Andrade — A Plantonista em Alerta Silencioso

**Médica plantonista de emergência em rede hospitalar de Santa Catarina, sobrecarregada por escalas extenuantes, que esconde sinais de esgotamento porque teme que buscar ajuda formal comprometa sua reputação e seu registro no CRM.**

| Campo | Valor |
| --- | --- |
| Persona ID | PU-001 |
| Tipo | Primária |
| Escopo do produto | Autoavaliação, chat de acolhimento por IA, escalonamento em crise, matching de pares (todo o lado "usuário médico" da plataforma Zelo*) |
| Válida para | Médicos(as) com CRM ativo atuando em regime de plantão ou alta carga assistencial em hospitais, redes de saúde ou cooperativas médicas (ex.: Unimed) em Santa Catarina, com sinais de sofrimento psíquico não tratado |
| Não válida para | Estudantes de medicina/residentes com apoio psicológico institucional já estruturado; gestores hospitalares (persona compradora, ver Nota); pacientes |
| Confiança | Proto — baseada em dados agregados publicados (CFM/AMB 2022) e no brief do desafio; 1 entrevista primária realizada (Dr. David Mendes, gestor médico, 02/07/2026), ainda insuficiente para validar como padrão geral |
| Última validação | 2026-07-07 |
| Responsável | Equipe do desafio "Saúde do Médico" — 1ª Jornada Incubintech |

`*Zelo é um nome de trabalho sugerido para o produto, ainda não validado (marca/domínio) pela equipe. Ajustar em todos os documentos se o nome mudar.`

> **Nota sobre persona secundária:** o painel institucional é consumido por um(a) gestor(a) hospitalar/RH — uma persona compradora distinta, ainda não documentada em detalhe. Recomenda-se criar essa segunda persona antes de aprofundar o design do painel de monitoramento.

---

## Persona Card

**Dra. Camila Andrade — A Plantonista em Alerta Silencioso**
Camila, 34 anos, é médica emergencista, atua em plantões de 12h em um hospital de médio porte na Grande Florianópolis e também atende por uma cooperativa médica. É referência técnica para a equipe, mas há meses sente exaustão emocional persistente, distanciamento cínico dos pacientes e queda na sensação de realização profissional — os três eixos clássicos do burnout (MBI-HSS). Nunca comentou isso com ninguém no trabalho.

**Frase-chave:** "Se alguém do RH descobrir que eu procurei ajuda psiquiátrica, isso vai parar no meu prontuário funcional antes de eu conseguir explicar que só estou cansada."

**Objetivos.** Continuar exercendo a medicina sem que o sofrimento psíquico vire um processo administrativo; encontrar um espaço para nomear o que sente sem burocracia, prontuário ou risco à carreira; eventualmente ser encaminhada a ajuda profissional real, no seu tempo e nos seus termos; manter a qualidade do cuidado que presta aos pacientes mesmo exausta.

**Frustrações.** Canais de saúde ocupacional existentes passam pelo RH ou pela chefia médica, o que ela entende como exposição; falta tempo, entre plantões, para terapia particular regular; teme que uma autoavaliação formal vire documento usado contra ela em avaliações de desempenho; já viu colegas serem informalmente "marcados" após pedir afastamento por saúde mental.

**Regras de design — sempre.** Sempre calcular e mostrar o resultado da autoavaliação sem que o dado bruto saia do dispositivo dela; sempre deixar claro, em cada tela, o que é anônimo e o que exige identificação; sempre oferecer — nunca forçar — o próximo passo de ajuda; sempre exibir um atalho visível para falar com uma pessoa real (par médico ou psicólogo), mesmo fora de um sinal de risco automático — achado da entrevista com Dr. David Mendes (02/07/2026), que afirmou desconfiar no "menor sinal" de estar falando com uma IA em vez de uma pessoa de verdade.

**Regras de design — nunca.** Nunca enviar dado identificável para o hospital/cooperativa que financia a ferramenta; nunca emitir diagnóstico dentro do chat de IA; nunca reter a identidade dela sem consentimento explícito e contextual, mesmo em caso de crise.

---

## 1. Demografia & Identidade

| Atributo | Detalhe |
| --- | --- |
| Idade | 34 anos |
| Localização | Florianópolis / Grande Florianópolis, SC |
| Formação | Graduação em Medicina + Residência em Medicina de Emergência |
| Cargo | Médica plantonista / emergencista |
| Porte da organização | Hospital de médio porte (~300 leitos) + cooperativa médica regional |
| Equipe | 6 a 10 profissionais por turno de plantão (médicos, enfermagem, técnicos) |
| Reporta a | Coordenação médica do pronto-socorro → Diretoria clínica do hospital |
| Stakeholders | Pacientes atendidos no plantão; equipe de enfermagem; coordenação médica avaliadora |
| Papel de compra | Apenas usuária final (não decide a compra; quem paga é o hospital/cooperativa) |
| Acessibilidade | Uso predominante em smartphone pessoal, em pausas curtas; conexão instável em áreas do hospital |

**Estágio e trajetória de carreira.** Está consolidando a carreira como especialista — já não é residente, mas ainda constrói reputação. Qualquer mancha percebida, inclusive um pedido de ajuda mal interpretado, pesa desproporcionalmente nessa fase.

**Influência organizacional.** É uma peça relativamente substituível do ponto de vista institucional (plantonista, não sócia da cooperativa), o que paradoxalmente aumenta o medo de expor fragilidade — ela teme ser preterida em escalas futuras se for vista como "instável".

---

## 2. Tecnologia & Contexto de Ambiente

| Ferramenta | Papel |
| --- | --- |
| WhatsApp | Comunicação com a equipe de plantão e escalas |
| Prontuário eletrônico hospitalar | Registro clínico dos pacientes (não da própria saúde dela) |
| App do plano de saúde/cooperativa | Consultas e exames; raramente usado para saúde mental |
| Instagram/redes sociais | Válvula de escape rápida entre atendimentos |

**Fluência digital.** Alta para ferramentas do dia a dia, mas pouca paciência para processos com muitas etapas de cadastro/verificação — se a ferramenta exigir "muita burocracia" para uma avaliação de 5 minutos, ela abandona.

**Padrões de adoção e abandono.** Adota rápido se o primeiro uso já entrega valor perceptível (ver o próprio score) sem pedir identificação antecipada; abandona no primeiro sinal de que a "confidencialidade" é apenas discurso de marketing.

**Ambiente de trabalho.** Celular pessoal, entre plantões, muitas vezes em pé no corredor ou na sala de descanso; sessões curtas, interrompidas a qualquer momento por uma emergência.

---

## 3. Jobs to Be Done

**Funcional.** Quando percebe sinais de esgotamento durante ou após um plantão pesado, ela precisa entender objetivamente se o que sente é "só cansaço" ou algo que exige atenção clínica, para decidir se e como buscar ajuda.

**Emocional.** Quando busca esse entendimento, ela quer se sentir segura e não julgada, para que checar a própria saúde mental não vire mais uma fonte de ansiedade.

**Social.** Quer ser vista pelos colegas e pela coordenação como a profissional competente e estável que sempre foi, mesmo processando sofrimento psíquico em paralelo.

**Subjacente.** No fundo, ela negocia uma tensão estrutural da profissão médica: cuidar dos outros é a fonte da sua identidade profissional, e admitir que precisa de cuidado ameaça essa identidade — o produto precisa validar que buscar ajuda é parte de ser um bom médico, não uma falha nele.

---

## 4. Objetivos & Motivações

**Objetivo de vida.** Continuar praticando medicina de emergência com orgulho, por décadas, sem que isso custe a própria saúde mental ou a própria vida.

**Autoconhecimento seguro.** Entender com clareza clínica (não achismo) se está em burnout, ansiedade ou depressão — implica escalas validadas (PHQ-9, GAD-7, MBI-HSS) com feedback imediato e sem jargão.

**Ajuda sem exposição.** Conseguir conversar com alguém (IA ou humano) sobre o que sente sem que isso vire registro formal — implica anonimato técnico real, não apenas prometido.

**Rede de apoio entre pares.** Sentir que não é a única passando por isso — implica matching com outros médicos na mesma situação, também anônimo.

**Meta de experiência 1.** Sentir alívio, não mais um formulário de RH, ao abrir o app.

**Meta de experiência 2.** Sentir que pode parar de usar a qualquer momento sem consequência.

**Meta de experiência 3.** Sentir que, se piorar, existe uma porta de emergência clara e acessível.

---

## 5. Padrões Comportamentais & Modelos Mentais

**Modelo mental central.** Camila trata qualquer sistema institucional de saúde do trabalhador como extensão da hierarquia hospitalar — algo que existe para proteger a instituição, não para protegê-la. Ela projeta essa desconfiança em qualquer ferramenta nova até que a arquitetura de privacidade seja explicada e, mais importante, verificável (ex.: "processado no seu aparelho" convence mais que "seus dados estão seguros conosco"). Este é o ponto mais importante da persona: a confiança precisa ser demonstrada tecnicamente, não apenas declarada.

**Padrão de trabalho principal.** Ciclos intensos e reativos durante o plantão, seguidos de janelas curtas (5-15 min) de tempo pessoal — qualquer interação com o produto precisa caber nesses intervalos.

**Padrão de qualidade.** Como médica, valoriza instrumentos validados clinicamente (reconhece PHQ-9/GAD-7 de sua formação) mais que qualquer copy de marketing; um score sem base clínica reconhecida perde credibilidade instantaneamente.

**Limiares de tolerância.** Zero tolerância a fricção que pareça coleta de dados "só para cadastro"; qualquer campo obrigatório de identificação antes do valor percebido gera abandono imediato.

---

## 6. Padrões de Decisão & Confiança

**Como a confiança se constrói e se quebra.** Uma única percepção de que dados vazaram, ou de que a instituição "sabe mais do que deveria", destrói a confiança de forma irreversível — não há segunda chance neste produto. A confiança se constrói devagar, ao longo de várias interações em que nada de ruim acontece.

**Filtro de adoção.** "Isso pode chegar até meu empregador?" → "Isso vira prontuário oficial?" → "Se eu parar de usar agora, alguém percebe?" → "Quem mais da minha categoria confia nisso?"

**Perfil de risco.** Extremamente avessa a risco reputacional/profissional; tolerante a experimentar a ferramenta sozinha, mas só recomenda a colegas depois de validar pessoalmente que o anonimato se sustenta.

**Descoberta de funcionalidades.** Não explora menus; só descobre recursos se apresentados no momento certo do fluxo (ex.: a oferta de conexão com psicólogo só faz sentido no momento de risco identificado, não antes).

---

## 7. Fluxo de Trabalho & Contexto de Colaboração

**Ritmo de trabalho.** Plantões de 12h intercalados com dias de descanso; picos de sobrecarga emocional geralmente após turnos noturnos ou eventos clínicos graves (óbito, erro evitado por pouco, agressão de paciente/família).

**Modelo de colaboração.** Majoritariamente solitária no uso do produto; o matching de pares é a única camada colaborativa, e mesmo essa é anônima.

**Principal fricção de colaboração.** Não tem hoje nenhum canal de pares que não passe por relações hierárquicas ou de amizade pré-existentes — o que a impede de ser vulnerável com quem já a conhece profissionalmente.

**Dependências.** Depende de conexão de internet do hospital (às vezes instável); depende da existência real de psicólogos parceiros disponíveis para o escalonamento funcionar de fato, não apenas na tela.

---

## 8. Alternativas Atuais & Contornos

**Alternativa principal.** Não fazer nada — normalizar o cansaço como "parte da profissão" — ou desabafar informalmente com um colega de confiança específico, sem qualquer instrumento validado.

**Onde o produto entra.** Seria o primeiro ponto de checagem objetiva que ela usaria antes de considerar qualquer ajuda formal.

**O gatilho de abandono.** Qualquer sinal — real ou percebido — de que a "métrica agregada" do hospital pode ser cruzada com dados de escala/turno de forma a identificá-la individualmente.

---

## 9. Pontos de Dor & Necessidades Não Atendidas

**Medo de registro no CRM/prontuário funcional.** Evita qualquer canal formal de saúde mental porque não confia que a informação fique isolada da avaliação profissional; isso a mantém sem qualquer suporte por anos.

**Falta de tempo para terapia tradicional.** Consultas semanais presenciais não cabem na escala de plantão; o custo de oportunidade de faltar a um plantão para se cuidar é alto.

**Ausência de instrumento de autoavaliação confiável e privado.** As escalas clínicas que conhece (PHQ-9, GAD-7, MBI-HSS) não estão disponíveis para autoaplicação anônima fora de um consultório.

**Isolamento entre pares.** Não existe hoje um espaço seguro para trocar com outros médicos que sentem o mesmo, sem o risco social de expor fragilidade a colegas conhecidos.

**Desconfiança de soluções "corporativas" de bem-estar.** Iniciativas de RH de saúde mental já vistas por ela pareciam performáticas ou serviam para gerar métricas de gestão, não cuidado real.

---

## 10. Definição de Sucesso & Padrão de Qualidade

**Padrão de precisão.** O score da autoavaliação precisa corresponder ao que as escalas clínicas realmente medem — ela notaria e desconfiaria de qualquer simplificação que "amaciasse" um resultado grave.

**Padrão de tempo.** Uma autoavaliação completa deve caber em uma pausa de plantão (ideal: menos de 5 minutos); em crise, a resposta precisa ser imediata, não "em até 24h".

**Padrão de autossuficiência.** O resultado da autoavaliação sozinho já precisa gerar valor (autoconhecimento), mesmo que ela nunca avance para o chat ou o matching.

**Padrão de qualidade por contexto.** Em uso rotineiro, "bom o suficiente" é entender a tendência do próprio score ao longo do tempo; em sinal de risco agudo, o padrão sobe para resposta imediata e sem fricção para conexão humana.

---

## 11. Princípios de Design & Heurísticas de Tradeoff

1. **Anonimato sobre conveniência** — nunca pedir dado identificável para acelerar o fluxo, mesmo que isso simplifique o produto.
2. **Transparência técnica sobre promessa de marketing** — sempre explicar onde o dado é processado (dispositivo vs. servidor), não apenas dizer "é seguro".
3. **Oferecer sobre forçar** — no momento de risco agudo, a IA sugere conexão humana, nunca impõe ou bloqueia o uso até aceitar.
4. **Velocidade sobre completude** — uma autoavaliação curta que ela realmente termina vale mais que uma bateria completa que ela abandona.
5. **Consentimento contextual sobre consentimento genérico** — pedir permissão específica no momento exato em que a identidade seria exposta, nunca um "aceite os termos" genérico no cadastro.
6. **Evidência clínica sobre design "fofo"** — usar linguagem e instrumentos que uma médica reconheça como sérios, evitando tom infantilizado comum em apps de bem-estar genéricos.

---

## Evidência & Confiança

| Fonte | Tipo | Detalhe |
| --- | --- | --- |
| EDT-01 | Documento normativo | Edital 1ª Jornada Incubintech (IFSC), 2026 — contexto do desafio e critérios de avaliação |
| BRF-01 | Brief do desafio | Documento "medicos_burnout_doc_1" — contexto, problema, objetivo da PoC fornecidos pela organização demandante |
| PIT-01 | Material de pitch | Pitch deck do time, com dados CFM/AMB 2022 (57% sintomas de burnout, <12% buscam ajuda) e taxa de suicídio médica |
| FLX-01 | Especificação de fluxo | Diagrama "Fluxo de Acolhimento e Escalonamento em Crise" (Caminho B) |
| ENT-01 | Entrevista com usuário | Entrevista com Dr. David Mendes (gestor médico, PS/UTI), 02/07/2026 — confirma barreiras de estigma e cultura workaholic; revela forte preferência por interação humana real sobre IA em momentos de sofrimento, baixa tolerância a fluxos robóticos/automatizados, e preferência por falar com outro médico (corporativismo/confiança) |

**Validado.** A prevalência de burnout e a baixa procura por ajuda profissional entre médicos brasileiros (fontes CFM/AMB) são dados publicados e amplamente citados no setor — não fabricados para este exercício.

**Assumido.** Todos os traços comportamentais específicos de "Camila" (medo do CRM, padrão de uso em pausas de plantão, desconfiança de RH) são inferências plausíveis a partir do problema declarado, não de entrevistas diretas com médicos reais.

**Perguntas em aberto.**
1. Médicos de diferentes especialidades e regimes de trabalho (plantonista vs. consultório, público vs. privado) compartilham o mesmo padrão de medo do CRM?
2. Qual o real apetite por "matching de pares anônimo" vs. preferência por atendimento profissional direto? — *Parcialmente informada pela ENT-01*: Dr. David Mendes indica maior conforto em falar com outro médico por corporativismo/confiança, mas reconhece psicólogo como opção válida. Amostra de 1 entrevista, insuficiente para generalizar.
3. Em que estágio de sofrimento a pessoa efetivamente abre o app pela primeira vez — prevenção ou já em crise? — *Indício da ENT-01*: o entrevistado sugeriu uso mais provável "durante o trabalho, em situação de crise", mas também citou uso preventivo tipo check-in (referência aos apps Cogni e I Am).

**Governança.** Revisar esta persona após as primeiras entrevistas com médicos reais (recomendado: durante os checkpoints da Jornada ou no início da pré-incubação). Critério de aposentadoria: substituir por versão "Validada" assim que houver pelo menos 5-8 entrevistas convergentes.
