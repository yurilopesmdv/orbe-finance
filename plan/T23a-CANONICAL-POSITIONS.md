# T23a — Posições e reservas canônicas

Estado: done (DTO interno/fixtures). PORT-02/04/05/08, OF-05/06, SEC-01/02/08/12/15. Integrador único; depende T15a/T20b2/T21a.

## Contrato

Criar src/features/sync/positions.ts, gates enabled/privateDataApproved, nenhuma rede/fonte Pluggy. Contexto confiável ownerSubject/connectionId UUID, instituição enumerada, productinvestment|reserve, allowedPositionIdsUUID≤10000, allowedParents≤10000 pares {product:account|investment|reserve,idUUID}. Validar sem tocar payload antes do gate. Relações/pais são evidência do contexto/adapter, não Auth concedida pelo cliente.

DTO {connectionId,product,items,nextCursor,authoritative,sourceUpdatedAt}; linha própria{id,connectionId,product,currency,grossCents,netCents,valueBasis,asOf,relation,parent,assetClass,kind}. Todos campos obrigatórios, null explícito para valores/data/pai. Valores seguros inteiros (negativo preservado), valueBasisgross|net|unknown, classefixed_income|equity|fund|other|unknown; investmentkindasset, reserveasset|allocation. Relação included exige pai permitido, demais exigem parentnull. Namespace product:<connection>:<id> e pai mesmo padrão (account compatível T21a); reconciliar candidato da página para ciclos/conflitos e referências de mesmo valor/moeda quando disponíveis. Mesmo pai ainda não recebido será parcial no consolidado futuro; não inventar valor do pai.

OwnedPosition extends OwnedAsset com grossCents/netCents/valueBasis/assetClass preservados. amountCents derivado da base escolhida, unknown→null; não inferir disponibilidade/retorno. Saída mínima congelada, rowCount antesdedupe, completecursorNull, authoritative apenas cobertura explícita/fonte/linhas resolvidas, partial por valorbase/data/relação desconhecidos ou negativo. Datas estritas/UTC, sourceinstante/null. T23b1 estenderá store para metadata; T23b2 estágio; T23c adapter real/gates.

## Paths / aceite

spec004, este plano, src/features/sync/positions.ts, tests/sync/positions.test.mjs, package.json, tasks/TASKS.md, roadmap/STATE.md/ROADMAP.md, AGENTS.md, README.md, docs/security/BRIDGE-CORE.md.

Validar offzeroacesso, vínculo/scope, centavos/moeda/data, base gross/net/unknown sem inferência, allocation não soma, reserva incluída/account/investimento auto não duplicam, pai ausente/estrangeiro/self/ciclo, dedupe/conflito/limites, extraPII ausente. Typechecks+suite; sem store/persistência/UI/rede/export/deploy.

## Evidência

476 testes/typechecks aprovados (15 novos): base gross/net/unknown, sobreposição, reserva/alocação sem soma extra, pai ausente/ciclo/moeda/valor inconsistente e projeção sem PII. Sem store/UI/transporte real, sem novo export/deploy. Metadados bruto/líquido ainda não conservados em MemoryAssets, próxima T23b1.
