# T51b2c2 — leitura autenticada de contas

20/10/2026, MPG-17, responsável integrador único, depende T51b2c1/LeasePorts/Auth ports. Paths _shared/account-read.ts, testes de composição, allowlist, tasks/STATE. Sem deploy/migration/segredo. Factory gatedfixtureOnly, handler POST/accounts/read, schema fechado interno, Auth antes de resolver; resolução owner+connection+revision validada, contexto capturado. Lease.check(accounts) antes e depois; Auth novamente ao final. Um deadline20s/abort abrange todas as portas, sem retries. Lease acquire/finish pertence ao lote e não é assumido pelo handler. Saída whitelist e metadata de cobertura sem PII/IDs externos.

Aceite: offzero, método/rota/query/body/token/limites; anonymous/nonowner/expired/foreignconnection não acessam provedor; resolução capturada não muta durante await; leasefalse antes/depois, sessão revogada/trocada após coleta, abort/timeout/late sem resposta financeira; integração com porta real mockada AuthPluggy/decoder/projeção produz29centavos mínimo. No-store/erros sanitizados. Typechecks/suíte/scan/commit/push/CI. Próximo resolver service-only de bindings e endpoints de lote, ainda inativos até gates.

Concluída:759 testes/typechecks,12 casos novos; auth/lease revalidados após leitura, abort/deadline sem resposta tardia. Handler não publicado nem importado por entrypoint ativo. Resolver service-only ainda pendente.
