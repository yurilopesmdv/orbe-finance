# T23b2 — Staging concreto de posições/reservas

Estado: done (fixtures/engine interno). PORT-08/09/10, OF-06/15, SEC-07/08/12. Integrador único; depende T23a/b1/T20b2/T21b.

## Contrato

Extrair loop de account-staging para asset-staging.ts interno, preservando callbacks de uso único, contexto scope capturado, caps/cursor/ciclo/lease/revisão/20s no coordenador/guard store/clear. Engine recebe somente função concreta local confiável das factories e shape AssetPage; nunca callback desserializado. Gates no engine e nas factories. Mapa cacheaccount/investment/reserve→coordenadoraccounts/investments/reserves. Erros genéricos constantes por factory, mantendo contrato de testes de contas.

Account factory mantém snapshot/validação contexto e normalizador T21a antes de delegar. Nova position factory captura todos campos/arrays/pares limitados do contexto T23a (pais projetados), valida com página vazia não autoritativa e delega normalizePositionPage. Não abrir ticket em prepare, só stage; promoção única completa com guard no commit MemoryAssets e valuation validado. Ciclo entre páginas não precisa ser inferido por normalizador de uma página: MemoryAssets valida candidato completo antes de swap. Fonte mista/parcial impede deleção, pai fora da página continua contexto autorizado e reconciliação final define parcialidade do consolidado.

## Paths / aceite

spec004, este plano, src/features/sync/asset-staging.ts/account-staging.ts/position-staging.ts, tests/sync/position-staging.test.mjs, package.json, tasks/TASKS.md, roadmap/STATE.md/ROADMAP.md, AGENTS.md, README.md, docs/security/BRIDGE-CORE.md.

Suite anterior de contas confirma regressão. Novos testes coordenador→normalizador→stager→cache, valuation e duas páginas, reserva incluída conta sem somar, produto trocado/contexto alterado, fonte mista e vazio desconhecido preservam anteriores, ciclo/conflito entre páginas falham sem swap, guard/lock/clear/tardio/gates/limites mantidos. Typechecks+suite; módulos não importados pela UI, sem export repetido/rede/deploy.

## Evidência

493 testes/typechecks aprovados,10 novos. Regressão de contas preservada após extração do engine; posição→cache mantém valuation, reserva incluída não soma, ciclo/conflito entre páginas/guard/lock não publicam, fonte mista e vazio desconhecido conservam anteriores. Sem nova UI/transporte/segredo/dependência/export/deploy.
