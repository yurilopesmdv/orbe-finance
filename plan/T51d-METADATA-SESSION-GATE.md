# T51d — Sessão ativa na leitura de metadata

Estado: done (RLS próprio; runtime da ponte segueoff). SEC-07/08/14/21, AUTH-09, OF-18/19. Integrador único; depende T37a/T36b.

## Evidência e decisão

[Supabase sessions](https://supabase.com/docs/guides/auth/sessions) documenta que logout remove linhas auth.sessions e recomenda correlacionar session_id para ações sensíveis; [claims](https://supabase.com/docs/guides/auth/jwt-fields) define amr/session_id. Decisão própria: aplicar prova também a metadataRLS/ponte, preservando orbe_is_owner como identidade, não sessão. JWT válido sozinho pode continuar aceito até expiração. Logout offline não confirma revogação remota, checagem usa momento/snapshot da query; não alegar retirada de bytes já entregues.

Helper T37a usa FORSHARE, inadequado em GET/read-only. [PostgreSQL17](https://www.postgresql.org/docs/17/sql-set-transaction.html) define modo de acesso. Probe temporário próprio com rollback confirmou que podemos preparar fixtures e depois SETTRANSACTIONREADONLY na mesma transação, sem dados do titular. Usar isso para provar leitura positiva real em read-only, não só inspeção de source.

## Contrato/migration

Nova migration20261019233000_metadata_session_gate (7), sem editar seis aplicadas. Extrair corpo de private.session_action_allowed(bool) para overload privado(bool,bool locksession), ACL negada a todos clientes/serviço; segundo bool determina SELECTcontrolfields auth.sessions FORSHARE ou SELECT sem lock. Gates/claims/AMR/provaOwner iguais, validar sub==auth.uid e relógio/exp novamente após adquirir row. Wrapper antigo1param preserva contrato forçando locktrue, mantendo pause/remove. Nova public.orbe_has_session() retorna overload(false,false), sem args/IDs, EXECUTEauthenticatedapenas. Não habilita comandos ou lê valores financeiros.

Trocar somente policiesSELECT connections/accounts para orbe_has_session ANDowner_idauthuid, grantsDML continuam revogados e vínculos privados intactos. BridgeREST authenticate usa nova RPC no mesmo Bearer, nega isOwnerfalse antes de metadata; runtime publicado continua literalfalse, sem redeploy nesta fatia.

## Paths / aceite

spec006, este plano, supabase/migrations/20261019233000_metadata_session_gate.sql, supabase/functions/_shared/supabase-rest.ts, tests/bridge/rest.test.mjs, tests/admin/metadata-access.sql, scripts/backend-admin.py, tests/admin/backend_admin_test.py, docs/security/BRIDGE-CORE.md, tasks/TASKS.md, roadmap/STATE.md/ROADMAP.md, AGENTS.md, README.md.

Metadatafixturefakeusers/sessions11/12 e ownerregistry só dentro BEGINROLLBACK: positivaowner1row/join, outro0, claims inválidas/sessão expirada/ausente→0 mesmo identityownertrue, ACL privada; restaurar contexto e terminar com SETTRANSACTIONREADONLY prova positiva. Helperconfereowner/resíduo incluindo sessões mesmo em erro. Bridgefixture Authserveruser válido+sessionRPCfalse não consulta metadata. Typecheck cliente/ponte+suite/Python; migration7 aplicada e SQL metadata/controls regressão reais com rollback/zero fake/ownerpreservado. Semexport por backend/helper somente, sem login real/novo endpoint/banco.

## Evidência

556 testes/typechecks aprovados (+4 guardsadmin/+1bridge). Migration7 aplicada/imutável. SQL metadata real confirmou owner1/join, alheio0, sessão apagada/expirada/malformada→0 mesmo orbe_is_ownertrue, e leitura positiva com SETTRANSACTIONREADONLY. Regressão SQL pause/remove passou com caminhoFORSHARE preservado. AmbosBEGINROLLBACK, zero usuários/sessõesfake e owner real preservado. Probe temporário também revertido. Sem stress multissessão/novo endpoint/redeploy/UI/login real.
