# T36b — Ciclo de vida de caches por sessão

Estado: done (fixtures/sem UI privada). AUTH-09/11, OF-18, SEC-07/08/09. Integrador único; depende T36a/T12a/T14a/T15a.

## Contrato

Criar createSyncSession(sessionPort,scopeFactory,policy), gateenabled/privateDataApprovedtrue só emfixtures. SessionPort só assertUnlocked/getSnapshot/subscribe; nenhum token/subject Auth exposto. Capturar métodos e validar unlocked antes de chamar factory UUID local/iniciar caches. Factory precisa fornecer UUID novo por vida de cache; geração criptográfica real não implementada nem presumida em Expo Go. Principal MemoryScope é {subject:scopeId,generation:0,unlocked:true}, separado de identidade HTTP. Stores privadas criadas internamente e não expostas.

Retornar kindready/scopeId/getSnapshot(stateactive|closed,running), queryAssets/queryMovements, run, cancel, close. Query/run chamam assertCurrent, que revalida port/snapshot e fecha ao falhar. Assinatura em qualquer estado não unlocked chama close: principalnull, abortactive, stores.close, unsubscribe; cleanup resistente a erro sem log. Rechecar estado depois de assinar para fechar corrida. Instância closed não reabre com novo login.

Run usa único AbortController privado, retorna busy sem tocar argumentos se outra execução ativa; cancel aborta só busca e conserva cache. close purga e remove assinatura. Router ganha expectedOwnerSubject opaco capturado em options e nega contexto de outro escopo antes de acquire; controller injeta seu scopeId sem ler AuthUUID/JWT. Clock de teste opcional não deve ser lido quando closed/busy. UI/DemoProvider/transportreal seguem sem ligação.

## Paths / aceite

spec001, este plano, src/features/sync/session-cache.ts/product-batch.ts, tests/sync/session-cache.test.mjs/product-batch.test.mjs, package.json, tasks/TASKS.md, roadmap/STATE.md/ROADMAP.md, AGENTS.md, README.md, docs/security/BRIDGE-CORE.md.

Testar com SessionModel e gateway inventado: off/locked sem factory; ingest/query validas; AppState-like lock/expiry sem timer fecha imediatamente; unsubscription e nova sessão cache vazio; cancel conserva cache e permite busca posterior; busy/closed não toca argumentos, resposta tardia não restaura; local scopealheio negado antes de acquire. Typechecks+suite; semexport por módulo nãoimportado/semrede/deploy/segredos.

## Evidência

531 testes/typechecks aprovados,13 novos (12 lifecycle +1 scope esperado no router). SessionModel com gateway inventado comprova lock/background/expiração sem timer, cancel que conserva cache, busy, resposta tardia, nova sessão vazia e unsubscribe em corrida. Scope local não é UUID Auth nem comprovação HTTP. Não foi implementado gerador criptográfico/runtime privado, transporte/integração UI/cache real; não houve export repetido/rede/deploy.
