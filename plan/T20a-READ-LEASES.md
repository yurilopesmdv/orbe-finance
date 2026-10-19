# T20a — Lease/cooldown de leitura por conexão

Estado: done. OF-04/08/09/12, MPG-02/04/06. Depende T13/T19a. Integrador único.

## Contrato de dados

Nova migration20261019210000_read_leases.sql, sem editar3 aplicadas. Tabela orbe_private.connection_reads, uma linha por conexão: owner/revisão/lease UUID aleatório/started/expiry/nextread/completed/outcome enum. FK composta conexão+owner cascade. RLS sem policy, sem ACL inclusive service_role; acesso somente pelas funções definer com search_path vazio. Nenhum saldo/movimento/cursor/erro bruto. Linha substituída na próxima aquisição, apagada com conexão.

Trigger de revisão em public.orbe_connections: owner/institution/state/OFverified/authexpiry/capabilities alterados ⇒ revision>=old+1; downgrade/null rejeitados. Atualizar last_read/source_updated não altera revisão de autorização. Alteração manual para revisão maior é permitida e invalida lease antigo. Função trigger privada, sem grant público.

## RPCs somente service_role

- orbe_begin_connection_read(connection,owner,expectedrevision): lockFORUPDATE da conexão antes de ler lease; dono precisa ser app_owner e dono da linha, active/OF/não expirado e pelo menos um produto true. Retorna unavailable genérico, busy (lease ativo), cooldown ou acquired com UUID/revisão/expiry/nextread. TTL120/cooldown900 hardcoded serverclock; cliente não escolhe tempo. Rev nova não burla cooldown.
- orbe_check_connection_read(connection,owner,revision,lease,product): mesma ordem de locks, revalida elegibilidade+produto true, lease atual/completednull/expiryfutura. Retorna boolean; paginação não altera cooldown.
- orbe_finish_connection_read(connection,owner,revision,lease,outcome): success/failed/cancelled apenas, mesmas verificações; conclui exatamente lease/revisão vigente e libera busy mantendo cooldown. Só success atualiza last_read_at. Revogado/vencido/duplicado retorna false.

App_owner não usa auth.uid no serviceRole: servidor fornece UUID já verificado por Auth/RPC; função confere registry e rowowner. RPC/grants não autorizam usuário ou gate no lugar da ponte. T20b integra fluxo de página no adapter futuro, revalidando após rede antes de entregar/promover. Não existe cron/job ou chamada bancária.

## Paths e validação

spec002, este plano, migration nova, tests/admin/read-leases.sql, scripts/backend-admin.py, tests/admin/backend_admin_test.py, package.json, docs/security/BRIDGE-CORE.md, docs/DESENVOLVIMENTO.md, roadmap/STATE.md/ROADMAP.md, tasks/TASKS.md, AGENTS.md, README.md.

SQL real em transação rollback com2 AuthUUIDs fictícios31/32 e conexões fictícias, registro owner substituído apenas dentro da transação; helper confere owner real antes/depois e zero resíduos. Casos service/auth/anon/tableACL, acquire/busy/paginação/cooldown, leaseerrado/expirado/outcome/revisão, pause/resume/expiry/capabilityfalse/null, ownerforeign, lastread e cascade. Manipular tempo somente no fixture SQL privado, sem sleeps/clienttimeparam. Testes sequenciais comprovam respostas/ACL; não afirmar concorrência multissessão testada. FORUPDATE serializa aquisição por row segundo semântica PostgreSQL. TypeScript/suíte local +migrate/testSQL/metadata regression reais.

Fontes primárias19/10: [row locks PostgreSQL17](https://www.postgresql.org/docs/17/explicit-locking.html) e [security definer/search_path](https://www.postgresql.org/docs/17/sql-createfunction.html). Parâmetros120/900 são política Orbe, não SLA do fornecedor. Próxima T20b adapter simulado; provedor real continua gates T63/T78/OF.

## Evidência

335 testes/TypeScript cliente+ponte aprovados;22guardas admin agora incluem3do runner de lease. Migration4 aplicada/verificada no histórico,6 tabelas metadata/Auth. SQL lease/RLS rollback real passou, owner preservado/zero fakeusers; owner-access e metadata regressões reais passaram. Sem teste multissessão, sem financeiro/cron/banco conectado. Não editar esta migration aplicada. Próxima T20b1 portas REST de lease com rede simulada, depois coordenação T20b2.
