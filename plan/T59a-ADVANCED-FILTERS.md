# T59a — Filtros avançados da demonstração

Estado: done. RPT-01/02/03/09, UX-05. Depende T30a/T57a/T58a. Integrador único.

Paths: spec007, este plano, src/data/demo/filters.ts, report-route.ts, src/app/(tabs)/movements.tsx, src/app/reports.tsx, report-detail.tsx, tests/data/report-route.test.mjs, docs/PRODUTO.md, tasks/TASKS.md, roadmap/STATE.md, AGENTS.md.

Catálogo apenas de duas contas inventadas com instituição explícita. Summary sem valores/texto digitado. Seletores avançados no relatório: banco/conta/tipo/categoria; month atual preservado. Lista Movimentações ganha conta e summary sempre visível. Não duplicar query: queryMovements/spendingReport já recebem filtros. Rota do detalhe amplia schema com account/type opcionais conhecidos, compatível com links anteriores, recusa extras/arrays e pares banco-conta incompatíveis; preserva todas as dimensões no drill-down e parcialidade global por contexto.

Aceite: roundtrip de filtro por conta/tipo e categoria soma exatamente mesma seleção no relatório/detalhe; rejeitar conta/tipo/params inválidos sem ampliar seleção. TypeScript cliente/ponte/suíte/export iOS/scan privado; revisão de resumo sempre visível e clear mantendo mês. Físico/VoiceOver ficam ao final; T59b privado depende fontes/runtime/gates. Sem teste espelhando texto JSX.

Rota inclui scopeCategory conhecida para recomputar o mesmo contexto pai de categoria/parcialidade. Campo incompatível com a categoria do grupo é recusado; links anteriores mantêm escopo todas. Não transportar total ou flag parcial na URL.

## Resultado

TypeScript cliente/ponte e283 testes aprovados (4novos: conta/tipo roundtrip e reconciliação, rotas inválidas, compatibilidade all, escopo pai e parcialidade). Bundle Hermes iOS e scan privado aprovados. Não há nova rede/persistência. Próxima T60a comparação pura de períodos sem percentuais enganosos.
