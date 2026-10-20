# T51b2c22 — Resolver e portas privadas de inventário

MPG-37. Integrador único. Depende MPG-34/36. Paths: migration20261020180000, pending-inventory-rest.ts, testesSQL/account-bindings e tests/bridge/pending-inventory-rest.test.mjs, account-network.ts/teste, package.json/spec/TASKS/STATE. Sem entrypoint/flags/secret/deployfinanceiro.

1. Resolver somente pending/ownerfixo/revisão com retorno técnico mínimo privado.
2. PortasREST com destinos literais/bodytipado/prevalidaçãototal/gates/deadline/cancelamento/bounds.
3. Atualizar allowlist de rede somente para RPCs necessárias, headersecret e limite128KiB específico do staging.
4. Testar owner/privilégios/estado/revisão/erros/IDOR/abort/rede; migration e rollback fictício próprios.

Aceite: cliente não resolve item externo, zero chamadas provedor ou contas reais; wrapper não ativa conexão. Próxima c23 coordenador de descoberta em fixtures com consentimento e revalidação antes de registrar.
