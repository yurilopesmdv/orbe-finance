# T22c18 — Transporte e manifesto cliente

SEC-35; dependeT22c17. Integrador único. Paths: movement-transport.ts, tests/sync/movement-transport.test.mjs, package.json, spec006, TASKS/STATE.

Capturar contexto de registry/local, única aquisição, lease/revisão e paginação sequencial com manifesto interno estável. Normalizar cada página existente e retornar envelope whitelist/accountIds para criação posterior de stager. Finalização dedicada somente ao final. Não persistir nem promover ledger; sem UI/gates/deploy. Validar fluxo fake, recusaescopo/manifesto/cursor/concorrência, lock/abort e DTO. Check/scans/Git; módulo ainda isolado do runtimeUI, export/runtimeaudit só quando entrar no grafo do app. Próxima orquestrador com stager criado na primeira página autorizada.
