# Roadmap — Gui (DevOps)

> Ver `README.md` para a linha do tempo completa e as decisões de produto que embasam estas tarefas.

## Semana 1 — até 11/07/2026 (Checkpoint 2, foco Fase 2)

- [ ] Montar a infraestrutura de deploy da PWA (hosting, HTTPS, pipeline básico de CI/CD).
- [ ] Configurar armazenamento seguro das chaves da API de LLM e demais segredos (secrets management), sem expor credenciais no client.
- [ ] Revisar com Mauricio a infraestrutura de backend para garantir que o servidor nunca recebe dado bruto de autoavaliação em texto claro (checagem de logs, variáveis de ambiente, payloads).

## Semana 2 — 12/07 a 18/07/2026 (Checkpoint 3, foco Fase 3)

- [ ] Construir, com Mauricio, o diagrama de fluxo de dados que demonstra a arquitetura de privacidade ponta a ponta — entregável obrigatório do checklist do desafio.
- [ ] Configurar o canal cifrado de ponta a ponta usado na conexão ao vivo médico–psicólogo (token de sessão efêmero) no caminho de crise.
- [ ] Rodar testes básicos de latência da API de LLM usada no chat de acolhimento.
- [ ] Apoiar a documentação do protocolo de escalonamento do ponto de vista técnico/infra (dono principal: Mauricio).

## Semana 3 — 19/07 a 25/07/2026 (Fase 4 + preparação final)

- [ ] Garantir funcionamento offline (PWA) e testar em condição de conexão instável, simulando o cenário real de plantão hospitalar.
- [ ] Preparar o ambiente estável para a demo ao vivo do dia 25/07 (plano de rollback, monitoramento de disponibilidade no dia da apresentação).
- [ ] Revisão final de segurança: confirmar que toda comunicação dispositivo-servidor relativa a dados de saúde trafega cifrada (PRD FR-14), antes da entrega final.

## Pendências que dependem de decisão do time

- Confirmação do provedor de LLM (impacta a arquitetura de rede e o custo de infra).
- Confirmação (ou simulação documentada) de parceiro psicólogo real para o caminho de aceite em crise.
