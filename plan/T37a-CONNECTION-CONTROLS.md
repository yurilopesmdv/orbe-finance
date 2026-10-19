# T37a — Pausa e remoção de metadados

Estado: done (metadata própria; sem banco/fornecedor). OF-08/12/19, AUTH-08, SEC-07/08/14. Integrador único; depende T13/T20a/T19b1/T36b.

## Pesquisa e decisão

[Claims oficiais](https://supabase.com/docs/guides/auth/jwt-fields) documentam session_id e amrpassword/timestamp; [sessões](https://supabase.com/docs/guides/auth/sessions) descreve vínculo session_id→auth.sessions e consulta da existência para ações sensíveis após logout. Inferência própria: remoção deve combinar senha recente com sessão nova, não confiar em iat de refresh. Schema do projeto próprio consultado sem ler linhas: id/user_idUUID não nulos, created_at/not_after timestamptz nullable. Nada de senha/sessionID real consultado.

Migration nova20261019230000_connection_controls, sem editar cinco anteriores. Helper privado session_action_allowed(require_recentbool), SECURITYDEFINERsearch_path vazio, ACL negada inclusive serviço. auth.uid/orbe_is_owner, roleauthenticated/is_anonymousfalse/expnúmero futuro e session_idUUID canônico. SELECT auth.sessions só campos de controle, usuário do JWT e FORSHARE até fim da ação, not_after ausente/futuro e created_at conhecido/não futuro. Não alterar schema/linhas Auth em operação normal ou conceder novos grants. Conferir AMRarray≤16, entradas permitidas password/totp/token_refresh, nenhuma recovery/otp/unknown/malformada, password com timestamp inteiro conhecido; para remove exigir created_at e password entre agora−300s e agora+60s. Pausa aceita senha anterior enquanto sessão/token válidos. Mudança de contrato Auth falha fechada; testar fixtures, sem alegar login real.

RPC public.orbe_pause_connection(connectionUUID,expectedRevisionbigint), somenteauthenticated, retorna false para contexto/revisão/state indevidos; lock da conexão própria e active→paused (revisão via trigger), paused/currentrevisiontrue sem incrementar. Sem resume nesta fatia.

RPC public.orbe_remove_connection(connectionUUID,expectedRevisionbigint), mesmo owner/sessão+recent. Revisão divergente de linha própria false; ausente/foreign devolvetrue semdelete como estado desejado idempotente/genérico. Delete da própria conexão faz cascade em accounts/bindings/readleases. Somente booleanos; no clientDML/fornecedor/PII/financepayload. Locks limitados2s em funções, transporte futuro20s. Não afirmar serialização multissessão testada se só cenários sequenciais.

## Paths e aceite

spec002, este plano, supabase/migrations/20261019230000_connection_controls.sql, tests/admin/connection-controls.sql, scripts/backend-admin.py, tests/admin/backend_admin_test.py, package.json, docs/security/BRIDGE-CORE.md, tasks/TASKS.md, roadmap/STATE.md/ROADMAP.md, AGENTS.md, README.md.

Helper novo comando test-connection-controls fixo com owner antes/depois e resíduo0 de fakeusers71/72/sessões fake; sem SQL arbitrário CLI. Unit helpers, sintaxe Python/TypeScript/suite; aplicar migration própria e executar SQLBEGIN/ROLLBACK com papéis reais: anon/serviceACL, owneralheio, claims/session/AMR inválidos, sessão revogada/not_after/velha, pausa/fencelease, remoção recent/cascade/stale/idempotência. Nunca queryAuthusers reais/credenciais/senha. UI/cachepurge/fornecedor ficam T37b/c.

## Evidência

535 testes/typechecks aprovados (+4 guards Python). Migration6 aplicada e verificada por hash; cenário SQL real passou com BEGIN/ROLLBACK, zero usuários/sessões fake restantes e owner original preservado. Testou ACL real, claims/sessões/AMR inválidos, recuperação, refresh sem senha, sessão velha/encerrada/not_after, owner/linha alheia, revisão, pausa/fencelease e remoção/cascade/idempotência. Helper confere rollback/owner também após erro de execução. Cenários sequenciais, sem stress multissessão. Não houve login com senha do titular, banco/fornecedor, nova UI/export/deploy. Migration aplicada é imutável.
