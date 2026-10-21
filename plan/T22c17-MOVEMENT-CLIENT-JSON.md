# T22c17 — JSON cliente de movimentações

SEC-34; dependeT22c16. Integrador único. Paths: bounded-json.ts, session-json.ts, tests/security, package.json, spec006, TASKS/STATE.

Extrair reader interno com teto e exportar entrada nomeada fixa1MiB para movementRead; preservar API padrão128KiB. Adicionar duas rotas fixas movementRead/movementFinalize, selecionando reader pelo discriminante. Testar UTF8/chunks/teto/MIME/abort/origem/rotas/semcache e não ampliar demais operações. Check/exportios/auditoria runtime/scan, checkpointGit. Sem UI/gates/EASpublish. Próxima transport transacional e integração com stager/manifesto.
