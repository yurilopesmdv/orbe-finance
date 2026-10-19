# T60a — Comparação mensal pura

Estado: done. RPT-04/10, SEC-12/16. Depende T26/T57a. Integrador único.

Paths: spec007, este plano, src/domain/comparison.ts, tests/domain/comparison.test.mjs, package.json, docs/PRODUTO.md, roadmap/ROADMAP.md/STATE.md, tasks/TASKS.md, AGENTS.md, README.md.

Observação: month/currency/netCents nullable/coverage complete|partial|missing/observedAt nullable. Missing exige valor/data null; complete exige valor conhecido, mas sem data não permite percentual. Datas civis ou timestamp offset validados pelo helper existente e limites de hora explícitos; month encerrado somente se anterior ao mês de observedAt em Brasília. Nenhuma leitura de relógio global/rede. Meses consecutivos e moeda única. Copiar somente campos conhecidos e congelar projeção.

Retornar deltas conhecidos mesmo parciais, percentual nullable e motivo enum. Base zero/negativa e mês aberto nunca geram infinito/percentual falso. BigInt para delta/razão; se resultado não cabe em inteiro seguro, retornar indisponível para esse resultado, preservando originais. Sem histórico completo não inventar comparação.

Aceite: casos nominal/inverso/0/negativo/null/ausência/parcial/mês aberto/Brasília/virada anual/invalidade/precisão/overflow/projeção; typecheck cliente/ponte/suíte. T60b depois liga UI somente a observações fictícias explicitamente declaradas; T60c composição/evolução não é rentabilidade. Atualizar roadmap ainda com pausa histórica para estado ativo atual.

## Resultado

TypeScript cliente/ponte e297 testes passaram,14novos cobrindo contrato/precisão/Brasília/ausência/meses/overflow/projeção. Sem UI ou dependências novas; export não necessário nesta fatia pura. Roadmap atualizado para execução ativa, preservando histórico da pausa. Próxima T60b UI demonstrativa.
