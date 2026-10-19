# T21a — Normalização canônica de contas

Estado: done (somente DTO interno/fixtures). OF-04/06/16, MPG-05/08, SEC-01/02/08/12/15. Integrador único; depende T13/T15a/T19b1/T20b2. T21 não estará completa por esta fatia.

## Contrato e limite

Criar normalizador puro `src/features/sync/accounts.ts`. Portas e payload de fornecedor ficam fora. Somente fixtures inventadas; sem rede, segredo, deploy ou alteração UI. Política enabled/privateDataApproved requer true antes de tocar raw/context. Contexto local confiável: ownerSubject UUID, connectionId UUID, instituição enumerada, allowedAccountIds array de UUID internos do vínculo já autorizado. O normalizador valida pertencimento, mas não comprova Auth/OF nem o cadastro do vínculo.

DTO interno proposto: {connectionId, items:[{id,connectionId,currency,balanceCents,balanceAsOf,relation}], nextCursor, authoritative, sourceUpdatedAt}. Campos obrigatórios próprios; relação somente distinct/unknown; null valor/data permanece null. Moeda ISO-shaped uppercase3, sem conversão automática; instituição/contexto não vêm da linha. Aceita data civil válida ou instante estrito normalizado UTC; instante com hora inválida rejeita. sourceUpdatedAt é instante ou null. Rejeitar campos financeiros inválidos e contexto impróprio com erro invalid_account_page sem eco. Extras ignorados/nunca copiados.

Saída congelada: kindpage, items OwnedAsset projetados, complete derivado cursor, authoritative explícito somente com fonte conhecida e linhas resolvidas, partial quando fonte/valor/data/relação ausentes ou saldo negativo. Chave local account:<connectionUUID>:<accountUUID>. Todos produtos futuros devem usar namespaces diferentes e o mesmo mapeamento interno de conta. Dedupe idêntico, conflito invalida página inteira. Sem coerções/números decimais de provedor. Mapeamento monetário real e relações dependem T21c/evidência upstream. Limites1000 linhas/10000 vínculos/cursor512.

## Paths e aceite

spec002, este plano, src/features/sync/accounts.ts, tests/sync/accounts.test.mjs, package.json, tasks/TASKS.md, roadmap/STATE.md/ROADMAP.md, README.md, AGENTS.md, docs/security/BRIDGE-CORE.md.

Testar gates zeroacesso, vínculo alheio/troca conexão, moeda/centavos/datas inválidos, null/negativo, extraPII descartada, dedupe/conflitos, limites/cursor, vazio não autoritativo e integração fixture com MemoryAssets preservando lote anterior quando validação falha. Typecheck+suite; sem export repetido por módulo não importado pela UI. Checkpoint/commit/push antes da próxima task.

## Evidência

396 testes (15 novos) e TypeScript cliente/ponte aprovados. Integração de fixture com MemoryAssets conserva snapshot anterior depois de entrada inválida e vazio não autoritativo. Não houve mudança de dependências/UI/imports de runtime, rede financeira, export repetido ou deploy.
