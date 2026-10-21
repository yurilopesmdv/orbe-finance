# T22c2 — Janelas de movimentos UTC/Brasília

EXP-14/10 e MPG-05; dependeT22c1, integrador único, base05492c3. Paths: specs003, supabase/functions/_shared/transaction-month.ts, tests/bridge/transaction-month.test.mjs, scripts/bridge-deploy.py(allowlist), package.json, TASKS/STATE. Sem rota/gates/remotesecrets/client/deploy.

Fonte oficial21/10: https://docs.pluggy.ai/en/docs/products/transactions descreve dataUTC/direçãoexplícita; https://docs.pluggy.ai/en/reference/transaction/transactions-list-by-cursor admite filtrosdateFrom/dateTo inclusivos e nextopaco. Nosso builder limita31dias inclusivos. Planner cobre mêsUTC+dia1seguinte, divide somentequando necessário, classifica instantes pelo mêsIANA local e recusa datasmalformadas emvez de descartá-las silenciosamente. Não alegar cobertura completa sóporquery ou cursorfinal.

Testar fechamentoBrasília/UTC/ano/fevereirobissexto/DST2018, compatibilidade dasjanelas com builder e todosmeses do intervalo, ausência de sobreposição e dados/Intl não tocadosoff, datasimpossíveis/foraescopo/ISOestrito. Typechecks/suite/allowlist/scans, sem export por módulo backend não importado. Próxima T22c3 projeção mínima de movimentos com identidadeinterna, direção explícita/centavosexatos/status/descrição semextras e cursorprivado.
