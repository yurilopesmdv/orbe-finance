# T51b2c4 — ciclo do lote por HTTP

20/10/2026 MPG-19, integrador único; depende Auth/LeasePorts/c1c2c3. Paths _shared/read-lease-handler.ts, _shared/account-router.ts, testes, allowlist/docs. Dois endpoints fechados internos acquire/finalize, Auth antes+depois, owner derivado, deadline20s/body16KiB/no-store. Acquire expõe só campos de grant, finalize outcome enum/retorno true; erros genéricos. Router combina os dois com account-read sem habilitar entrypoint. Cancelamento após efeito SQL pode manter lease120s/cooldown900s: registrar sem retry/cleanup paralelo.

Aceite: gateszero; full acquire→read→finalize fixture; DTOs/status/cooldown/busy; Authnonowner/malformed/expired/revoked; body/URL/método/IDs/outcome; deadline/abort e erro sem payload; scopeowner confiável e serialização mínima. Typechecks/suíte/scan/commit/push/CI. Sem rede/deploy/banco real. Próximo gateway do app e lote em memória.

Concluída:778 testes/typechecks,10 casos novos. Router fixture percorre acquire→read→finalize, sessão revalidada após operações SQL, nenhum deploy.
