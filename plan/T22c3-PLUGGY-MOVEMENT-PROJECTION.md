# T22c3 — Projeção mínima de movimentos

EXP-15/10/13/14, MPG-05 e SEC-12/24. DependênciasT22c1/c2, based384f47; integrador único. Paths: specs003, supabase/functions/_shared/pluggy-movements.ts, tests/bridge/pluggy-movements.test.mjs, scripts/bridge-deploy.py(allowlist), package.json, TASKS/STATE. Semcliente/HTTP/entrypoint/chave/env/deploy.

Fonte21/10: https://docs.pluggy.ai/en/docs/products/transactions (UTC/direção/status/BANKvsCREDIT) e https://docs.pluggy.ai/en/reference/transaction/transactions-list-by-cursor (v2results/next). Implementar funçãoasync isolada: validar snapshot confiável/JSON exato, janela IANA/conta, rawnext via builder, dedupe/conflito e descrição mínima, HMACidentidade, DTO compatívelT22a comfinancialtypeunknown. Abort fecha/descarta. Não emitir tokencursor, apenas aceitar referência interna já confiável; emissão fica para transporte futuro.

Testar centavos0.29/limites/null/sinal/status/direção, IDOR/currency/window/cursor/PIIextras poison, monthboundary, duplicateconflict, abort/concurrent mutation e integração normalizadorMemoryLedger preservando overrides. Check/sintaxe/allowlist/scans; export não necessário pois módulo backend isolado. Próxima transporte/staging autorizado de movimentos com cursor criptográfico/lease e todas janelas concluídas, ainda sob gates reais.
