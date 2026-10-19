# T20b2 — Coordenação de lote com fixtures

Estado: done (fixtures, sem integração real). OF-12/14/15, AUTH-09, SEC-07/08/12. Depende T20a/b1/T19b1/T14a/T15a. Integrador único.

## Limites e contratos

Módulo cliente src/features/sync/read-batch.ts não importa secret/lease-rest/backend. Ports são transporte próprio da ponte sob SessionModel.read no futuro, não Pluggy direto. Sem endpoint/adapterHTTP real nesta fatia. Gates enabled/privateDataApproved false antes de tocar qualquer argumento sensível. Guard obrigatório assertCurrent(confere sessão/geração/revisão pelo controller), sinal de ciclo de vida e clock injetável. Normalizar DTO por T19b1 antes de qualquer acquire, escolher somente readableProducts.

Acquire único por conexão devolve grant camelCase(status,leaseId,revision,expiresAt,nextReadAt), UUID/revisão/prazos validados. Percorrer produtos sequencialmente, cursor opaco limitado512semcontrole apenas no corpo; recibo de página contém connectionId/revision/leaseId/product/rowCount/nextCursor/complete/authoritative/partial/sourceUpdatedAt. Até100páginas,1000linhas por página,10000por produto; sem retryinfinito. Complete equivale nextCursornull, cursor repetido rejeitado. Fonte desconhecida/mista e partial tornam resumo não autoritativo.

readPage retorna {receipt,stage(signal):undefined}: callback é código local confiável do normalizador T21–23, não dado desserializado; não deve promover cache, fazer rede ou ser async. Só executá-lo após validação+guards, com sinal de lote vivo (sinal da request já terminou). Resultado tardio de transporte não recebe stage. Coordenador guarda apenas progresso metadata; linhas ficam no stager privado futuro.

Após todos produtos completos, finalize('success') precisa retornar true. Então promote(assertFresh):undefined faz troca síncrona atômica por produto e precisa passar assertFresh aos stores no ponto de commit. Não prometer transação global entre stores; normalizadores/stager precisam validar antes de promover, T21+ serão responsáveis por conteúdo financeiro. Sempre clearStaging():undefined em finally se grant foi adquirido, sem apagar cache anterior. Falha não dispara finishfailed após perda de contexto; TTL libera lease, cooldown permanece. Nenhuma coleta real iniciada.

SessionModel ganha #requireSession e assertUnlocked público sem credencial, read usa mesmo precheck. MemoryAssets/MemoryLedger promote recebem beforeCommit?:()=>undefined após validar candidato e antes de swap; callbackasync/não undefined falha antes de alterar. Acrescentar abortImport a assets para cleanup de ticket. Guard de sessão e guard de lease são separados: expirar lease não deve purgar cache anterior, lock de sessão continua purgando conforme MemoryScope/controller.

## Paths

spec001/002; este plano; src/features/sync/read-batch.ts; src/features/auth/session.ts; src/data/local/assets.ts/ledger.ts; tests/sync/read-batch.test.mjs; tests/auth/session.test.mjs; tests/data/assets.test.mjs/ledger.test.mjs; package.json; docs/security/BRIDGE-CORE.md; docs/research/BANK-COVERAGE.md; tasks/TASKS.md; roadmap/STATE.md/ROADMAP.md; AGENTS.md; README.md.

## Aceite

Offzeroacesso; locked/expired/unknownproxy/capfalse não chama portas. Só stage depois de recibo válido; loops/limites/timeout/abort/sessão/revisão errados não promovem, transporte ignorando abort nunca stageatrasado. Todos produtos compartilhamlease e só finalize once antes de promote; finalizefalse preserva cache. clearStaging1x e sem extra request após falha. beforeCommit que lança preserva mapa anterior; assertUnlocked expira mesmo sem timer. Unit/TypeScript cliente+ponte, integração fixture com MemoryAssets, nenhuma chave real/redeploy.

## Pesquisa prévia de paginação

A [referência atual](https://docs.pluggy.ai/en/reference/basic-concepts) distingue cursor emv2 e páginas nos demais endpoints, e informa sunset31/12/2026 do /transactions legado. [Produto transações](https://docs.pluggy.ai/en/docs/products/transactions) ainda contém exemplos legados: preferir referência específica e confirmar disponibilidade do /v2/transactions no uso pessoal antes do adapter(T22/T76). Proibição de /v2/items pessoal não deve ser extrapolada automaticamente para /v2/transactions. Coordenador usa recibo interno, sem embutir parser/URL de fornecedor. SEC05 upstreamIDs/logging continua pendente ADR; sem exceção automática e sem fonte real.

## Evidência

381 testes (353 Node +28 Python), TypeScript cliente/ponte e export iOS Hermes aprovados. Scan do dist sem PAT/UUID do proprietário. 22 testes novos:17 coordenação,1 sessão,2 assets,2 ledger. Integração de fixture comprova que expirar lease durante validação conserva o snapshot anterior. Sem rede financeira ou redeploy.
