# T22c19 — Orquestração transacional em memória

SEC-36; dependeT22c18. Integrador único. Paths: movement-batch.ts, tests/sync/movement-batch.test.mjs, package.json, spec006, TASKS/STATE.

Reusar runReadBatch com products transactions e stager criado só na primeira página, após manifesto interno autorizado. Capturar contexto e comparar metadata owner/institution/connection; registry é fronteira, não provaBANK. Todas páginas compartilham manifesto. Finalização dedicada antes de promover, fresh/clearfinally. Testar2contas/subconjunto, falhaúltima/finishfalse/lock/manifestodrift, sem prefetch. Check/scans/Git; módulo ainda isolado, sem UI/env/export/deploy. Próxima controller/runtime protegido.
