# T51b2c32 — Gateway cliente da descoberta

MPG-47. Integrador único. Depende MPG-46/42. Paths: session-json.ts, features/accounts/discovery-gateway.ts, tests/accounts/discovery-gateway.test.mjs, package/spec/TASKS/STATE. Semflags/UI/publicação nesta fatia.

1. Acrescentar operação fechadadiscover com deadline120s/resposta4096 somenteparaela.
2. Validar inputinterno/origemprópria/config/session e whitelistcontagem, gatesoff e semretry.
3. Testar body/URL/limites/401403lock/429/abort/invalidade/hostextra; regressões e exportiOS pois helper écliente.
4. Checkpoint. Próxima c33 controlador de prontidão e integraçãoUI adaptativa, mantendo flagsfalse.
