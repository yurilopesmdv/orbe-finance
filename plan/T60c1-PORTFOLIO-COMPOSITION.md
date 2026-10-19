# T60c1 — Composição conhecida da carteira

Estado: done. RPT-05/06/08/12; depende T24/T31a/T26b. Integrador único. Paths: spec007, este plano, src/domain/composition.ts, src/data/demo/composition.ts, src/app/composition.tsx, src/app/(tabs)/portfolio.tsx, tests/domain/composition.test.mjs, package.json, docs/PRODUTO.md, roadmap/STATE.md/ROADMAP.md, tasks/TASKS.md, AGENTS.md, README.md.

Reutilizar reconcilePortfolio/countedIds. Classificação explícita por ID em catálogo (banco e account/investment/other); ausência gera unclassified. Recusar metadados malformados, não retornar extras. Mapas/grupos com chaves próprias sem herdar prototype. Agrupar valores com BigInt, calcular shares em basis points por piso/maiores restos: desempate lexicográfico por ID e retorno ordenado por ID, sem ordenar UI por valor oculto. Soma shares10000 se subtotal>0; base0 sharesnull. Cada agrupamento independente fecha no mesmo subtotal conhecido.

Tela secundária pela Carteira, filtros somente instituição conhecida da demo (parser estrito), mostra subtotal/parcialidade/fontes, listas por banco/classe com Money e percentageLabel/mesmo texto acessível. Sem gráfico externo/proporção visível quando oculto. Evolução explicitamente indisponível por falta de dois snapshots; T60c2 pendente. Percentuais de composição parcial se referem apenas ao subtotal observado, ao contrário de variação mensal incompleta.

Aceite: total/grupos/share arredondamento fecha, reserva/meta/limite fora, null/negativo/unknown/parcial/datas/moedas/base0 explícitos, classificação ausente sem perda e canários não retornados. TypeScript cliente/ponte/suíte/export iOS/scan; físico ao final. Sem histórico ou rentabilidade inventados.

## Evidência

TypeScript cliente/ponte e320 testes aprovados,13novos de composição/classificação/arredondamento/null/limite/moedas/projeção. Bundle Hermes iOS e scan privado passaram. Agrupamento e UI ordenam IDs, sem revelar ordem por valores ocultos. T60c2 história/evolução continua pendente; próxima T19a estados/capacidades de conexão puros antes de leitura.
