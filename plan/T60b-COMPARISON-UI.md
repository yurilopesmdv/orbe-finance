# T60b — Comparação mensal demonstrativa

Estado: done. RPT-01/04/08/10/11; depende T60a/T59a. Integrador único. Paths: spec007, este plano, src/data/demo/comparison.ts, src/components/comparison-label.ts, src/app/comparison.tsx, src/app/reports.tsx, tests/data/comparison.test.mjs, tests/presentation/comparison.test.mjs, package.json, docs/PRODUTO.md, roadmap/STATE.md/ROADMAP.md, tasks/TASKS.md, AGENTS.md, README.md.

Selecionar filtros do relatório → tela secundária comparação. Parser reutiliza validação estrita da demo, category=all permitido somente nessa rota. Fonte do cenário: setembro vazio completo e outubro parcial observado19/10; mês sem fixture não é consultado como vazio, retorna observação missing. Total vem de selectMovements canônico, não paginação. Todos os valores ausentes no lote selecionado resultam null/parcial. Sem estado privado/efeito/rede.

UI mostra dois períodos/data/cobertura, diferença observada (sem projeção) e percentual com motivo. Formatter de basis points inteiro usa BigInt, ocultação antes da validação e mesmo texto para visual/acessibilidade. Campos textuais não ecoam valores. Back por pilha mantém filtros.

Aceite: filtros conhecidos roundtrip, setembro0 explícito vs agostoausente, outubroparcial/diferença correta/refund/manualcorrection preservada, nullnão0, rejeição de extras/arrays; percentual exato/negativo/limites/null/ocultação. TypeScript cliente/ponte/suíte/export iOS/scan privado. Físico/VoiceOver ao final; nenhuma conclusão sobre banco real.

## Evidência

TypeScript cliente/ponte e307 testes aprovados (6cenários/rota e4formatos/ocultação novos). Bundle Hermes iOS exportado; PAT/UUID privados ausentes. Corpo explicativo financeiro oculto junto do percentual. Nenhuma nova rede/persistência. Próxima T60c1 composição conhecida da carteira; evolução sem histórico suficiente permanece indisponível.
