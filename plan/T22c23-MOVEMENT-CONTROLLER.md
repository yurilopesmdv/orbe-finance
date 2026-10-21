# T22c23 — Controller e runtime de movimentações

SEC-40; dependeT22c22. Integrador único. Paths: features/movements/controller.ts e runtime.ts, tests/movements, package.json, spec006, TASKS/STATE.

Adaptar padrãoaccounts com refresh(connectionId,month), query(filtros), status/capacidade/consent→registry→transport→cache.runMovements. Contextoscopeopaco local e classificação desconhecida preservados. Readyactive/lock/background/close/120s/mutex. Runtimeinjetado e flags independentes, sem ligarUI/config ainda. Check/scans/Git; export só ao entrar no grafoUI. Próxima hooks/tela e flag false explícita.
