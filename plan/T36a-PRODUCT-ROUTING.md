# T36a — Roteamento concreto da ingestão

Estado: done (fixtures, sem runtime UI). OF-11/15/18, AUTH-09, SEC-07/08/12. Integrador único; depende T20b2/T21b/T22b2/T23b2, após correção AuthT51c.

## Investigação e limite

SessionModel guarda somente JWT/expiry privados, snapshot sem subject. Não extrair UUID/JWT para integrar cache nesta fatia. DemoProvider usa IDs/seeds próprios e não será migrado silenciosamente. Runtime.liveIntegrationEnabled permanecefalse, app não importa este router; principal/contextos/store fornecidos por fixture confiável. Auth/read/lifecycle real e caches no lock serão T36b depois de contrato próprio.

Criar runProductBatch(metadata,contexts,stores,transport,options). Mesmo gate/guard/signal/clock do runReadBatch; off→disabled e publishedProducts[], antes de acessar qualquer dado. Verificar guard antes de clock/metadata; normalizeConnection e congelar DTO canônico elegível (stateactive reconstruído somente quando readableProducts não vazio), para não reler objeto mutável. Contexts contém ownerSubjectUUID e entradas específicas accounts/transactions/investments/reserves; projetar somente campos próprios esperados, conferir mesmo owner/conexão/instituição e produto antes de factory. Construir todos stagers antes de acessar acquire/readPage/finalize. Missingcontext falha antes de qualquer transporte.

Stores assets/ledger só acessados conforme produto. Capturar métodos de transporte, próprio da ponte futura; readPage retorna unknownDTO/envelope, não função. Request aborted não prepara resposta tardia. prepare não altera cache e coordenador controla stage/deadlines. Router chama promote de cada stager na ordem de readableProducts, capturando produtos publicados; cada swap recebe guard. Resultado metadata-only BatchResult+publishedProducts(enum[]), inclusive falha posterior ao primeiro swap. Não prometer transação global, retorno complete só se todos publicados. Error antes da fase publish preserva tudo.

clearRouter idempotente chamado pelo coordinator/finally encerra todos stagers, inclusive busy/erro de construção, sem apagar cache válido. Sem inserir logs/Auth/segredo/rede real/eventos. Não emitir statusfinanceiro em UI ou plugar DemoProvider.

## Paths / aceite

spec002, este plano, src/features/sync/product-batch.ts, tests/sync/product-batch.test.mjs, package.json, tasks/TASKS.md, roadmap/STATE.md/ROADMAP.md, AGENTS.md, README.md, docs/security/BRIDGE-CORE.md.

Testar os quatro produtos via coordenador/normalizadores/caches, off/lockedzeroacesso, produto indisponível/contexto ausente/scopealheio antes de acquire, mutação metadata/contexto/transport não altera operação, payload comstage nuncaexecutado, falha de página/finalize preserva todos, prefixo publicado explícito quando validação de produto posterior falha, abort/cleanup/partialidade e override. Typechecks+suite; módulo nãoimportado UI, semexport repetido/rede/deploy.

## Evidência

518 testes/typechecks aprovados,12 novos. Quatro produtos via coordenador/factories/stores, snapshot contra mutação, falta de vínculo antes de acquire, callback de payload não executado, falhas tardias conservam anteriores e prefixo publicado explícito quando commit posterior falha. Sem nova UI/transporte real/rede/export/deploy. Próxima T36b lifecycle imediato, sem expor identidade Auth.
