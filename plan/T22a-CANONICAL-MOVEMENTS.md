# T22a — Movimentos internos canônicos

Estado: done (DTO interno, sem fornecedor). EXP-01/02/04/05/06/10, OF-05/06, SEC-01/02/08/12/15. Integrador único; depende T14a/T20b2/T21a/b. T21c fornecedor não impede DTO interno sintético.

## Contrato

Criar src/features/sync/movements.ts normalizador puro, gates enabled/privateDataApproved. Contexto confiável capturado por chamada: ownerSubject/connectionId/accountId(UUID), instituição enumerada, monthYYYY-MM, allowedAccountIds(UUID≤10000, deve conter accountId), categoryIds(strings seguras1–80≤1000), confirmedOwnTransferIds(UUID≤10000). Nenhuma fonte/owner do DTO é aceita como autoridade.

DTO: connectionId/accountId/items/nextCursor/windowComplete/sourceUpdatedAt. Linha: movementId/accountId/amountCents/currency/direction/type/status/occurredAt/description/categoryId/reversalOf(null ou {accountId,movementId}). Campos próprios obrigatórios. Fonte local connection:<UUID>; externalId recebe UUID interno, não ID bruto de fornecedor. Valores centavos seguros não negativos/null, moeda3uppercase, descrição até240semcontroles e trim/NFC; não executar texto. Categoria apenas do catálogo; desconhecida não vira categoria arbitrária. Transferência não comprovada vira unknown/parcial, sem heurística Pix. Tipo/direção contraditórios rejeitam página (expense/contribution/card_settlement débito; income/redemption/yield/refund crédito). Referência estorno só refund, conta permitida e nunca self; não exige original na mesma página. Ausência mantémrefund mas parcial, cálculo exige original disponível.

Saída congelada OwnedMovement mínima, rowCount antesdedupe, complete=cursorNull, partial por windowCompletefalse/fonteausente/valorou tipo desconhecido/estorno semref. Sem authoritative/delete; ledger conserva ausentes. Datas civis ou instantes normalizadosUTC, occurrenceMonth usa Brasília; sourceUpdatedAt instante/null. Dedupe por movementId nesta conta, conflito invalida tudo.

## Paths / aceite

spec003, este plano, src/features/sync/movements.ts, tests/sync/movements.test.mjs, package.json, tasks/TASKS.md, roadmap/STATE.md/ROADMAP.md, AGENTS.md, README.md, docs/security/BRIDGE-CORE.md.

Testar gateszeroacesso, ownership/conta/mês/moeda/centavos/datas, direção explícita, pending/cancelled fora consumo, estorno20 de compra100=80, estorno outro mês com evidência, transferências somentecomprova, textoURLliteral semefeito, extras omitidos, dup/conflito/limites, janela incompleta/vazia, integração MemoryLedger e override preservado após nova normalização. Typechecks+suite, semexport por módulo nãoimportado/semrede/redeploy.

## Evidência

432 testes/typechecks aprovados (20 novos). Inclui compra100/estorno20=80, estorno de outro mês, pending/cancelled, direção/moeda/data de Brasília, transferência sem comprovação e override mantido após nova normalização. Sem rede/deploy/UI nova/export repetido.
