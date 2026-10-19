# T25 — Classificação pura

Estado: done, 19/10/2026. EXP-02/03/04. Dependências T04/T26; ingestão T14/T22 permanece futura. Responsável: implementação sequencial. Paths src/domain/classification.ts, tests/domain/classification.test.mjs, package.json e documentos/checkpoints.

Implementar classificação por campo com proveniência e precedência explícita. Preservar override nulo e categoria histórica arquivada, impedir inferência de transferência por descrição. Regras literais normalizadas e ordenadas independentemente do lote. Nenhuma persistência, rede ou autenticação simulada.

Aceite: alteração do provedor não apaga override; Sem categoria não perde valor; ordem da entrada não altera regra vencedora; ambiguidades exigem revisão; entradas inválidas falham com códigos genéricos. Validar TypeScript e suíte completa sintética.

## Evidência

TypeScript e 84 testes passaram, incluindo 18 cenários novos de classificação. Testes cobrem override persistente diante de mudança da fonte, null explícito, categorias arquivadas/removidas, campos independentes, ordenação estável, regras literais e transferências não confirmadas. Persistência/sync reais não implementadas nesta função pura.
