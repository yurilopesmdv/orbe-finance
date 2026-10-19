# T51a — Referências escalares

Estado: done. 19/10/2026. SEC-05/15, EXP-05/PORT-04. Responsável sequencial. Paths src/domain/expenses.ts/portfolio.ts, tests/domain/references.test.mjs e checkpoints.

Tipos TypeScript não filtram JSON em runtime: includedIn truthy e reversalOf com propriedades não escalares poderiam preservar payload aninhado inesperado. Validar shape estrito antes de fingerprint/cache; sem converter objetos em string, logar payload ou transformar ausência em zero. Preservar referência escalar ao pai ausente como parcial.

Aceite: entradas malformadas falham genericamente; tentativas de promoção no ledger/ativos preservam snapshot anterior sem canário. TypeScript/suíte. T51b de URLs/redirects/SSRF da ponte continua dependente de T18 e não fica concluída por isso.

## Evidência

TypeScript/216 testes passaram; quatro novos casos recusam referência não escalar/extra e comprovam que promoção malformada preserva ledger/ativos sem canário no retorno. Ref válida ao pai ausente continua parcial. Nenhum payload real utilizado. Revisão do Metro encontrou watcher.additionalExts incluindo env/local/development; antes de abrir LAN, T50a separará credenciais administrativas do root observável e bloqueará arquivos privados no bundler.
