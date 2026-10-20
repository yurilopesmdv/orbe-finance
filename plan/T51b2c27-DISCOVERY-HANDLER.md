# T51b2c27 — Handler HTTP da descoberta

MPG-42. Integrador único. Depende MPG-41. Paths: inventory-handler.ts, tests/bridge/inventory-handler.test.mjs, package.json/spec/TASKS/STATE. Sementrypointativo ou cliente.

1. Fechar path/método/token/bodyinterno e coordenador com timeout/cancel/close/1inflight.
2. Whiteliststatus/contagem/headers, sem reflexão de respostas privadas ou exceções.
3. Testar HTTPpositivo/negativos/oversize/abort/close/busy/gatesoff, sem rede.
4. Check+Git; c28 composiçãobackend preparada com configuração comum, nenhuma ativação automática.
