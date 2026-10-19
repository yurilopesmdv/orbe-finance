# T21b — Estágio de contas e promoção protegida

Estado: done (fixtures, sem fonte HTTP). OF-15/16/17, SEC-07/08/12. Integrador único; depende T20b2/T21a/T15a.

## Contrato

Factory `createAccountStager(store, context, policy)` retorna disabled sem tocar argumentos quando gates não true. Captura e valida contexto/array de vínculos uma vez. Instância por execução, sem reset/reutilização. `prepare(raw, request)` valida DTO interno sem tocar store; request canônica de accounts com UUID/revisão/lease/cursor. Retorna PageWork com recibo congelado local e stage síncrono. Antes do estágio nenhuma alteração de buffer/ticket; callback guarda versão e só pode stage uma vez, com sinal vivo, ordem/cursor/contexto idênticos. Primeira stage abre ticket; posteriores acumulam até10000linhas recebidas/100páginas. Normalizador expõe rowCount anterior à deduplicação; checar repetição conflitante entre páginas.

Acumular authoritative AND de todas páginas e fonte conhecida/única; partial/misto impede remover ausentes. `promote(assertFresh,signal)` exige página final, valida sinal e chama guard imediatamente e no MemoryAssets.beforeCommit; promove todas linhas de uma vez com complete true. Sucesso encerra instância; clear em finally esvazia buffer e aborta ticket não promovido; se store já fechou, negar acesso é esperado e nenhuma saída é publicada. Callback antigo não pode reabrir após clear. Preparar resposta tardia fora da instância encerrada falha. Sem transação multi-produto, sem assert de banco real. Coordenador continua responsável por finalize/owner/revisão/TTL.

## Paths / aceite

spec002, este plano, src/features/sync/account-staging.ts/accounts.ts, tests/sync/account-staging.test.mjs, package.json, docs/security/BRIDGE-CORE.md, tasks/TASKS.md, roadmap/STATE.md/ROADMAP.md, README.md, AGENTS.md.

Testar runReadBatch→normalizador→stager→MemoryAssets com fixtures: duas páginas/promoção única, falha na segunda/finalizefalse/lock/guard no commit preservam anterior ou purgam no lock; alteração de contexto original não amplia vínculo, cursor/revisão/lease/ordem/duplo callback falham, clear invalida tardios, duplicata conflitante, limites de linhas mesmo duplicadas e fonte mista não remove ausentes. Typechecks+suite; sem export por código não importado pela UI, sem rede/deploy.

## Evidência

412 testes/typechecks cliente+ponte aprovados,16 novos. Fluxo completo coordenador→normalizador→stager→MemoryAssets validado, incluindo guard que vence no segundo check de commit, lock que purga cache e contagem de linhas anterior ao dedupe. Nenhum export repetido por módulo ainda não importado pela UI, nenhuma rede financeira/deploy.
