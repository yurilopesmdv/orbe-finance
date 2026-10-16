# Revisão documental da etapa R0

Data: 16/10/2026, America/Sao_Paulo. Escopo: somente planejamento. Este arquivo registra verificações documentais, não execução de app ou integração bancária.

## Verificações

Revisão concluída nesta etapa:

| Checagem documental | Resultado |
|---|---|
| Arquivos Markdown | 27 documentos, incluindo 9 specs |
| Requisitos identificados | 78; todos aparecem nas tasks e na matriz de validação |
| Microtasks futuras | 73; dependências existentes e grafo sem ciclos |
| Links locais | Nenhum destino inválido |
| Whitespace | Sem espaços finais; git diff --check aprovado |
| Arquivos não Markdown alterados/criados | Nenhum |
| Segredos/ambiente do F1 reutilizados | Nenhum |

A conferência automática foi executada por script temporário fora do repositório, sem adicionar código ao projeto. Rastreabilidade textual e grafo íntegro não provam viabilidade funcional; a revisão manual verificou os limites abaixo.

## Revisão de coerência

- As specs foram gravadas antes do plano e das tasks.
- Bancos e preferência gratuita vêm das respostas do usuário, não de inferência.
- Face ID está rastreado e deferred; senha cobre a primeira fatia Expo Go sem mascarar a limitação.
- Modalidade pessoal é candidata, não integração homologada; documentação e execução real são estados distintos.
- Modo off, idempotência, ownership, revogação, retry limitado e falhas parciais fazem parte do plano.
- Reservas/caixinhas não são automaticamente ativos adicionais e podem chegar em representações diferentes.
- Roadmap e STATE preservam próximos passos sem depender de contexto do chat.
- Tasks de implementação permanecem não iniciadas; não houve instalação, conta cloud, consentimento, conexão, deploy ou chamada bancária autenticada.

## Limites

Não foram executados testes de software, SDK, iPhone, biometria, RLS, sincronização ou reconciliação com dados reais. Não houve validação comercial de marca, contrato de provedor ou preço dentro de conta autenticada. Fontes/preços foram consultados publicamente e precisam ser revalidados antes de uso. Zero código não significa funcionalidades já prontas: os documentos são contratos para implementação posterior.

## Revisão de privacidade e relatórios

Políticas e fontes oficiais adicionais consultadas; resultados em docs/security. Rastreabilidade e grafo revalidados após acrescentar 26 requisitos e 17 tasks. Aprovação de fornecedor, testes de software/tráfego/aparelho e verificação de implementação continuam pendentes. Os resultados locais não demonstram ausência universal de vazamento.

## Revisão 0.3 — PF

PF confirmadas pelo usuário. Capacidade local selecionada e integração direta investigada separadamente, sem prometer cobertura/gratuidade. SPEC-008 criada antes da trilha de plano/tasks correspondente. Links, rastreabilidade e grafo revalidados; nenhuma execução de software ou análise de extrato real.

## Revisão 0.4

SPEC-009 escrita antes do plano Meu Pluggy e das tasks T74–T78. Alteração preserva IDs antigos e explicita precedência sobre arquitetura exclusivamente local. Pesquisa passiva em fontes primárias, sem dados reais, login, scan de infraestrutura ou exploits. Validação documental verifica links locais, rastreabilidade de requisitos e grafo de dependências; nenhum teste de software ou scan de dependências pode ser declarado executado nesta fase.

Validação documental 0.4 executada: 30 Markdown, 10 specs, 86 requisitos rastreados, 78 microtasks; links locais resolvidos, requisitos presentes no backlog e matriz, dependências existentes e grafo sem ciclos. Somente Markdown alterado, sem whitespace final. Dependência de Mercado Pago em Inter removida: expansão não bloqueia a prioridade PF. Nenhum teste funcional do app executado.

## Revisão 0.5 — origem exclusiva

Escopo simplificado para Open Finance. PF-05/T68 retirados, IDs reservados; dependências ajustadas. Implementação e push na main autorizados, uma task por vez. Histórico de revisões abaixo/anteriores não altera a direção vigente.

Validação 0.5 executada: 30 documentos, 10 specs, 85 requisitos ativos e 77 tasks; links resolvidos, requisitos rastreados, dependências válidas e sem ciclos. PF-05/T68 reservados, sem reuso. Nenhum código alterado.

## T74 — revisão de contrato

Specs de acesso/Open Finance/fornecedor ajustadas antes do contrato da ponte. Backlog revisado para metadados server-side e finanças locais, sem worker/webhook no MVP; dependências de expansão retiradas do caminho de release. Pesquisa oficial confirmou limites do proxy, distinguindo-os dos conectores empresariais Open Finance. Não houve código, HTTP financeiro, testes RLS ou provisionamento.

Validação final T74 executada: 31 documentos Markdown, 10 specs, 85 requisitos ativos e 77 tasks; nenhum link quebrado/requisito sem rastreio/dependência inexistente/ciclo. git diff --check passou. Uma task concluída; T01 ainda não iniciada.

## T01 — runtime e estrutura

Requisito PRD-04: runtime confirmado textualmente pelo titular, matriz SDK/Node/iOS consultada em fontes oficiais, Node22.23.2/npm12.2.0 executados localmente, paths definidos e limites registrados. Somente Markdown alterado; nenhum pacote instalado ou app executado. Esta é conclusão documental de compatibilidade, não homologação física.
