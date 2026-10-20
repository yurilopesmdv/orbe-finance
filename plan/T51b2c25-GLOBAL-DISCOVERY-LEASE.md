# T51b2c25 — Lease global da descoberta

MPG-40. Integrador único. Depende MPG-36/37/39. Paths: migration20261020190000, tests/admin/account-bindings.sql, spec009/TASKS/STATE. Sem rede de provedor/HTTP/deployfinanceiro.

1. Reusar connection_reads e os prazos120/900, elegibilidadepending e ownerfixo.
2. RPC begin/check/commit com lock e nonce; commit usa staging existente e finaliza no mesmo statement.
3. Testar clientdeny/owner/revisão/nonce/busy/cooldown/expired/repeat/nenhumlast_read_financeiro.
4. Migration nova, SQL com rollback e owner/resíduos verificados. Próxima c26 portasREST do lease e composição do coordenador sem novo HTTP antes da prova pontaaponta.
