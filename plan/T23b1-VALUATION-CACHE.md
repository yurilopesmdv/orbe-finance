# T23b1 — Valuation no cache volátil

Estado: done (cache sintético). PORT-02/05/08/09, OF-06, SEC-01/08/12. Integrador único; depende T15a/T23a.

## Contrato

Mover ValueBasis/PositionClass e interface PositionValuation para src/domain/valuation.ts. Helper projectPositionValuation(raw,product,amountCents): nenhum campo próprio→undefined (fixture legada, não evidência de valuation); qualquer campo próprio exige todos quatro próprios, productinvestment|reserve, centavos seguros/null, enums válidos, amountCents igual à base escolhida (unknown exige null). Capturar/projetar somente quatro primitivos, erro genérico. Sem dependência data→features.

LocalAsset estende Partial<PositionValuation>, OwnedPosition exige os quatro via extensão de interface com redeclaração/tipo intersection compatível. Normalizador mantém saída plana atual/reexporttypes, consumidor não muda. MemoryAssets clean inclui só resultado do helper; valida assinatura completa dos candidatos antes de Map dedupe (reconcilePortfolio ignora metadata e sozinho não detectaria conflito gross/net). Compatibilidade de fixtures antigas preservada. List copy mantém somente primitivos, sem campos externos. Cache não infere missingmetadata de amount/asOf nem considera bruto+líquido ativos extras.

## Paths / aceite

spec004, este plano, src/domain/valuation.ts, src/features/sync/positions.ts, src/data/local/assets.ts, tests/data/valuation-cache.test.mjs, package.json, tasks/TASKS.md, roadmap/STATE.md/ROADMAP.md, AGENTS.md, README.md, docs/security/BRIDGE-CORE.md.

Testar normalizador→store→list preserva bruto/líquido/base/classe, cópia mínima e independente; conjunto parcial/enums/base/conta rejeitados; duplicata com mesmo amount mas bruto/classe divergente falha inteira; guard/erro conserva metadata anterior, legacy não inventa valuation, USD/negativo/null continuam explícitos. Typechecks+suite, semUI/rede/export/deploy.

## Evidência

483 testes/typechecks aprovados,7 novos. Normalizador→store→list conserva valuation, conflitos gross/classe não desaparecem no dedupe, base inconsistente/metadata parcial/conta recusadas; legado continua sem inferência. Guard/stale preservam metadata anterior. Sem mudança de UI/transporte/rede/dependências/export/deploy.
