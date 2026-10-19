# T24 — Reconciliação pura da carteira

Estado: done, 19/10/2026. Requisitos PORT-03/04/06, correlatos PORT-05. T04 concluída; funções não dependem de backend. Paths src/domain/portfolio.ts, tests/domain/portfolio.test.mjs, SPEC-004, package.json e checkpoints.

Contar uma única vez raízes de ativos explicitamente distintos, na moeda solicitada. Componentes incluídos são detalhe do pai, alocações/limites não são ativos adicionais. Unknown/null/referência ausente tornam subtotal parcial. Cycles/conflitos/moedas incompatíveis são erros, sem heurística por nomes. A função de variação preserva fluxo desconhecido como null e não calcula taxa de retorno.

Fixtures T04 M04/M05/M11 devem passar junto com cenários de ciclos, referência ausente, inclusão aninhada, IDs conflitantes, moedas, datas e resgate. Tudo inventado; nenhuma conexão bancária. Limites transacionais de alocações continuam T16, não são garantidos por cálculo puro.

## Evidência

TypeScript e 66 testes passaram: 19 de carteira, 18 de gastos, 20 de sessão e 9 de política de auditoria. Cobertos M04/M05/M11, ciclos, conflitos, moedas, datas, valor ausente e resgate sem rentabilidade inventada. Sem conexão ou dados reais.
