# T51b2c5 — gateway client de contas

20/10/2026 MPG-20; integrador único, depende c4/ProductBatch/SyncSession/T12. Paths src/features/sync/account-transport.ts, testes end-to-end fictícios/router, docs. Factory gatesoffzero, sessão.read e origem fixa, transporteinjetado, configuraçãopública, contextoIDsinternos/localcache capturado. POSTacquire/read/finalize no próprio backend; sem Pluggy/segredo no app. Resposta de contas normalizada antes de staging, binding/receipt completos, finalize sótrue confirmado. Abort/deadline/401 lock, sem retries. Contexto registry autenticado e readiness nativa pertencem à composição seguinte.

Aceite: fullHTTPfixture→SyncSession publica29centavos em memória, bloqueo purga, gatezero/locked/foreignorigin/foreignID/revision/lease/product/count/unsafeamount/redirect/401/429/abort/deadline; falha no finalize preserva snapshot. Typechecks/suíte/scan/commit/push/CI. Nenhum import de fornecedor/privilegedkey no cliente e financeirorealoff.

Concluída:786 testes/typechecks,8 casos novos; fluxo completo HTTPfixture com cache volátil e purge real do modelo de sessão, sem uso de contas reais ou publicação do app.
