# T51b2c24 — Coordenador autorizado de descoberta

MPG-39. Integrador único. Depende MPG-36/37/38. Paths: inventory-discovery.ts, tests/bridge/inventory-discovery.test.mjs, package.json/spec/TASKS/STATE. Sem HTTP/entrypoint/flags/deploy.

1. Coordenar tokenAuthowner→pendingresolve→inventário→Authsameowner→pendingresolveunchanged→storeatômico.
2. Capturar argumentos/metadados e validar todos antes da escrita; expiração/deadline/abort/busy/close com resultado redigido.
3. Testar pipelinepositivo e negativos com portas injetadas; documentar commitremotoapóscancel e falta de limiteglobal.
4. Check completo e checkpointGit. Próxima c25 composição backend preparada de descoberta e leitura, sem mascarar modo produção comofixture; revisar evidências/privacidade antes de habilitar provedor.
