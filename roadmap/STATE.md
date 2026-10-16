# Estado de retomada

Checkpoint: 16/10/2026, America/Sao_Paulo. Projeto: /home/yurilopesm/projects/orbe-finance. Repo: yurilopesmdv/orbe-finance. Estágio: R0 — investigação e planejamento. Nenhum código ou recurso de infraestrutura foi criado.

## Leia primeiro, nesta ordem

[AGENTS](../AGENTS.md) → este arquivo → [roadmap](ROADMAP.md) → [specs](../specs/README.md) → [plano](../plan/PLAN.md) → [tasks](../tasks/TASKS.md). Em uma tarefa específica, ler a spec e as ADRs relacionadas; não reler toda a pesquisa por padrão.

## Intenção e decisões recebidas

- App pessoal profissional, inicialmente só iPhone no Expo Go, senha e desejo de usar Face ID já cadastrado.
- Consolidar contas, gastos por tipo/categoria, investimentos e cofrinhos.
- Bancos: Mercado Pago, Bradesco, Inter e Nubank.
- Priorizar alternativa gratuita para uso próprio.
- Etapa atual: zero código; seguir spec → plan → tasks → implement, com microtasks e continuidade entre sessões.

## Concluído

P01–P05: repo inspecionado, documentação oficial consultada, seis specs escritas antes de plano/tasks, respostas do usuário incorporadas, decisões e backlog dependente preparados. P06 concluída no planejamento inicial: 19 documentos, 44 requisitos e 46 microtasks. Revisão atual de privacidade: 23 documentos, 8 specs, 70 requisitos, 63 microtasks futuras e zero código. Resultados em [validação documental](../docs/PLANNING-VALIDATION.md). Estado das specs: draft, sem aceite de execução real. Decisões arquiteturais: proposed, salvo restrições explícitas do usuário.

## Estado técnico real

Não há package.json, app, SDK selecionado, backend, banco, .env, credenciais, CI, testes executáveis ou deploy do Orbe. Não há conexão bancária real ou resultado financeiro homologado. Os testes descritos são critérios futuros. A pasta do Bolão F1 não foi alterada durante este planejamento e não é ambiente deste projeto.

## Achados que não devem ser perdidos

Face ID em Expo Go iOS tem impedimento documentado; R1 usa senha e R3 depende de distribuição compatível. Caminho candidato de custo, ainda não aprovado para dados reais: Meu Pluggy + proxy pessoal, com autorização no portal, IDs conhecidos e cadência definida pelo provedor. Não usar GET /v2/items nem forçar atualização de proxy. Banco na tabela de cobertura não é garantia para o consentimento real. Cofrinhos podem estar incluídos em saldos/posições e exigem reconciliação.

## Próximas ações executáveis

1. Revisar os documentos com o usuário e ajustar somente specs/plano se a etapa continuar sendo planejamento.
2. Antes de T01/T02, registrar modelo do iPhone, versão iOS e Expo Go; antes da homologação, identificar em quais bancos há reservas e tipo de conta (PF presumida).
3. Ao receber autorização para implementar, iniciar T01/T03/T04/T05 conforme dependências; não iniciar diretamente tela ou integração bancária.

Próxima task de código: nenhuma autorizada. Próximas tasks de fase seguinte: T47/T48 (diligência/confiança) e T01/T49 (runtime), respeitando dependências. Nenhuma frente/agente ativo e nenhum arquivo reservado para execução paralela.

## Bloqueios por escopo

| Condição | Impacto | Saída |
|---|---|---|
| Autorização atual é planejamento | Não implementar/provisionar nesta etapa | Instrução posterior para iniciar implementação |
| Face ID com Expo Go | AUTH-07/PRD-08 adiados | Decisão futura sobre development build |
| Cobertura real não testada | Impede declarar R2 pronta | Fichas por banco e testes após G2 |
| Aparelho/produtos detalhados não informados | Afeta bootstrap e homologação, não impede specs iniciais | Coletar no início das tasks relevantes |

## Formato de checkpoint para futuras sessões

Registrar: task e estado; spec/requisitos; commit base e alterações ainda sem commit; arquivos tocados; evidência/testes que realmente rodaram; falhas/limitações; dependências e próxima ação concreta; responsável e paths reservados se houver paralelismo. Usar IDs, nunca valores de tokens, CPF, contas ou extratos. Antes de retomar, conferir git status e se os arquivos correspondem ao checkpoint.

## Revisão de privacidade — não perder na retomada

O usuário priorizou evitar exposição financeira por qualquer via e pediu UI simples com relatórios profundos. Risco zero universal não é demonstrável. [Revisão de fornecedores](../docs/security/VENDOR-REVIEW.md) registra políticas amplas, funcionalidades externas e limites de residência/acesso; nenhuma evidência permite aprovar Pluggy/Meu Pluggy/Supabase para dados reais agora. Não há comprovação de vazamento do Orbe, que ainda não possui dados bancários.

SPEC-006 exclui dados reais de IA/MCP, devtools, Git/CI, logs, analytics, replay, BI, exports e links. Expo Go permanece sintético até avaliação e decisão de runtime para real. SPEC-007 estabelece resumo → relatório → lançamentos/posições, sem nova saída de dados. Gate T63 antecede T39 e todas as homologações reais.

Autorização continua apenas planejamento. Push dos commits anteriores para main permanece pendente da confirmação solicitada; não usar este pedido de revisão como autorização para envio remoto. Não há execução de ferramentas com dados financeiros reais, provisionamento ou contrato de fornecedor.
