# T22c22 — Batch transacional no cache de sessão

SEC-39; dependeT22c21/T22c19. Integrador único. Paths: session-cache.ts, tests/sync/movement-session.test.mjs, package.json, spec006, TASKS/STATE.

Adicionar runMovements no cache existente com mesmo mutex/controlador/guard local, para não criar stager antes de manifesto. Validar ownerlocal, busy entre produtos, cancel/lock/close, erro final e promoção após sucesso. Check/export/runtimeaudit/scan/Git pois session-cache já entra no app. Sem UI/gates/publicação. Próxima controller/runtime transacional protegido, depois tela.
