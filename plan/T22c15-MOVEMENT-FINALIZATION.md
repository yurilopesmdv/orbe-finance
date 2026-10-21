# T22c15 — Finalização transacional comprovada

SEC-32; dependeT22c14/migration14. Integrador único. Paths: migration15, fixture movement-pages, spec006, TASKS/STATE.

Nova RPC service-only orbe_finish_movement_read exige sessão/hash, capacidade, lease/revisão e progresso final sem nonce. Atualizar finalizador genérico em nova migration para negar sucesso de progresso iniciado incompleto, mantendo failed/cancelled e contas legadas. Fixture: sem progresso, claim pendente, final completo, outra sessão, sessão revogada, repetição e grants. DDL+fixture em rollback, hashes, scan/check, Git/CI antes de aplicar e fixture instalada. Sem backenddeploy/flags/chaves/leituras reais. Próxima adaptador REST/HTTP de finalização e cliente.
