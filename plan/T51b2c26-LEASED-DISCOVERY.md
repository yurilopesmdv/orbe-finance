# T51b2c26 — Coordenador com lease obrigatório

MPG-41. Integrador único. Depende MPG-40/39/37. Paths: lease-rest.ts (export parsercomum), pending-inventory-rest.ts, inventory-discovery.ts, account-network.ts, testes respectivos, package/spec/TASKS/STATE. SemSQLnovo/entrypoint/deploy.

1. Reusar parser degrant, adicionar acquire/check/commit RPC ao adapterpending e rede literal.
2. Exigir lease no coordenador antes/depois da coleta; remover store semlease do contrato de coordenação.
3. Testar busy/cooldown/perda delease/confirmfalse/URLbody e regressões anteriores.
4. Checks/Git; próxima c27 composição prepared da descoberta e contratoHTTP autenticado, sem ativação antes de revisão do bootreal/gates.
