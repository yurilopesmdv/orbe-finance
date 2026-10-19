# T22b1 — Publicação atômica multi-conta

Estado: done (cache volátil sintético). EXP-04/10/11, OF-05/06/15, SEC-07/08. Integrador único, depende T14a/T20b2/T22a.

## Decisão

Stager de movimentos por conexão não pode chamar promote em sequência e anunciar atomicidade por produto. Refatorar MemoryLedger com `promoteBatches(batches,beforeCommit?)`:1–1000 entradas {ticket,items,complete}, total≤10000linhas antesdedupe, source/mês iguais, escopos/tickets distintos. Capturar scopes/tickets e entradas canônicas, validar owner/conta/mês de todas, dedupe por lote, construir um candidate da store e validar merged view depois de todas inserções. Guard síncrono antes do único swap; verificar MemoryScope e identidade de todos tickets novamente, evitando callback reentrante que inicia pedido mais novo. Só então swap e apagar tickets usados.

API `promote` antiga delega a um batch, mantendo assinatura/semântica de erros existentes. Ausentes conservados, cancelamento explícito atualizado, overrides intocados. Falha não consome tickets válidos; cleanup do stager futuro aborta. Não criar método de delete/ajuste de mês silencioso. Sem alteração UI/imports, sem nova dependência/rede/migration.

## Paths / aceite

spec003, este plano, src/data/local/ledger.ts, tests/data/ledger-batches.test.mjs, package.json, tasks/TASKS.md, roadmap/STATE.md/ROADMAP.md, AGENTS.md, README.md, docs/security/BRIDGE-CORE.md.

Testes: duas contas publicadas juntas, segunda inválida preserva ambas, stale de qualquer ticket impede tudo, guard lança/não síncrono/reentrante invalida antes de swap, lock purga; owner/source/mês/escopo duplicado/limites inválidos, moedas/estorno cruzado preservados, atualização/cancelamento/override/ausência mantidos. Suite anterior confirma compatibilidade single-account; Typechecks completos. T22b2 staging continua futura.

## Evidência

443 testes/typechecks aprovados,11 novos. Compatibilidade single-account preservada pela suíte anterior. Segunda conta inválida/stale/guard reentrante não publica primeira; moedas e estorno cruzado validados, cancelamento explícito e override preservados, captura escalar do token evita troca do wrapper durante guard. Nenhuma chamada financeira, nova dependência/UI ou export repetido (ledger não importado pelo runtime UI).
