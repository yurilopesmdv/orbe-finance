# T51b2c7a — seleção explícita de produtos

20/10/2026 MPG-22, integrador único; depende c6/ReadBatch/ProductBatch/SyncSession. Paths sync/product-scope.ts, read-batch.ts, product-batch.ts, session-cache.ts e seus testes. Resolver puro enumsubconjunto/duplicatas/nãovazio/ordemcanônica, capturadoantesdeawait. Sem opção comportamento atual; selecionado parcial se não cobrir tudo. Contextos/cache não selecionados intocados, capabilities preservadas. Aceite accounts-only com metadata4produtos sem contextos extras, inválidos sem acquire, mutateoptionafterawait não amplia, SyncSessionforward e regressões. Typechecks/suíte/scan/commit/push/CI. Próxima c7b controlador de acesso às contas com proteção de tela e cachevolátil.

Concluída:799 testes/typechecks/6 cenários de escopo/imutabilidade/cache não selecionado/SyncSessionforward, regressões completas.
