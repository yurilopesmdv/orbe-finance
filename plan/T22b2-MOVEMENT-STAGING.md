# T22b2 — Staging de movimentos com manifesto

Estado: done (fixtures, sem transporte). EXP-10/11/12, OF-05/06/15, SEC-07/08/12. Integrador único, depende T22a/b1 e T20b2.

## Contrato

Factory createMovementStager(store,input,policy): offzeroacesso; input = contexto MovementPageContext sem accountId/confirmedOwnTransferIds + confirmedOwnTransfers pares(accountId,movementId) + accountIds manifesto1–100UUIDúnicos do allowedAccountIds. Capturar campos/listas limitadas antes de liberar instância. Sem manifesto vazio completo fictício: esse estado será tratado por controller futuro sem iniciar lote.

prepare(envelope,PageRequest) sem efeitos de store/buffer, somente transactions e mesma conexão/revisão/lease. Envelope interno {accountCursor,nextCursor,page}, onde page é DTO T22a da conta atual do manifesto. accountCursor inicia null e corresponde ao último page.nextCursor dessa conta; envelope.nextCursor é cursor global da conexão/produto. Globalnull somente depois da última página da última conta. Cada conta vazia ainda precisa de pageitems[]/page.nextCursornull explícita. Cursor não é interpretado nem forma URL. Sem transporte/backend real, não confundir sintaxe interna com API Pluggy.

PageWork recibo local rowCount antesdedupe/completeglobal/nextCursorglobal/authoritative=windowComplete&&!partial/source/partial. Coordinator agrega fonte mista/ausente; promoção ledger nunca apaga ausentes mesmo quando coverage autoritativa. Stage usa sinal de lote vivo, versão única, tracking de ciclos global/porconta, limites100páginas/10000rows e contexto estável. Ticket por conta aberto somente no primeiro stage; dedupe idêntico/conflito dentro de cada conta.

promote exige manifesto inteiro finalizado, todos tickets presentes e guard síncrono fresco; chama MemoryLedger.promoteBatches uma vez. clear idempotente descarta buffers e tickets, invalida callback tardio. Pós-sucesso instância encerrada. Todos produtos/conexões não são transação global.

## Paths / aceite

spec003, este plano, src/features/sync/movement-staging.ts, tests/sync/movement-staging.test.mjs, package.json, tasks/TASKS.md, roadmap/STATE.md/ROADMAP.md, AGENTS.md, README.md, docs/security/BRIDGE-CORE.md.

Validar integração coordenador→normalizador→stager→ledger com duas contas e múltiplas páginas, conta vazia/cancelamento/override; falha na última preserva todas, conta omitida/reordenada/fimglobalprecoce negados, cursor/lease/revisão/callback/cancel/lock/guard/limites, contexto imutável e parcialidade por janela/fonte. Typechecks+suite, sem export/UI ou rede/deploy.

Revisão durante implementação: evidência de transferência é por conta/movimento; reutilizar conjunto global de IDs em todas contas promoveria classificação indevida em colisão de UUID. Projeção por conta e teste específico adicionados antes de concluir.

## Evidência

461 testes/typechecks aprovados,18 novos; fluxo completo com duas contas e múltiplas páginas. Manifesto completo, janela/fonte parcial, cancelamento/override, guard/stale/lock, limites e isolamento de comprovação de transferência por conta validados. Sem rede financeira, nova UI/export/dependência ou deploy.
