# T22c10 — Progresso global de páginas de movimentos

EXP-20/SEC-07/12, dependeT22c9, base83940a6; integrador único. Paths: specs003, supabase/migrations/20261021100000_movement_page_progress.sql (migration13), tests/admin/movement-pages.sql, scripts/backend-admin.py, tests/admin/backend_admin_test.py, supabase/functions/_shared/movement-read.ts e seu teste de transporte (contagem antes de filtro/ciclo imediato), package.json, TASKS/STATE/RELEASE-READINESS. Não editar migrations aplicadas; nenhum cliente/flag/chave/deploy/provider.

Tabela privada com1slot por conexão, sessão/cursor emSHA256, nonceemvoo/seenhashes/contadores/finished. RPCclaim e commit usam ordem de locks conexão→lease→página, checam capacidade transactions/ownerfixo/consentimentos/revisão/lease e sessãoAuth. Inicialização só com rootHash; noncecondicional e capsantesderead. Nova lease reinicia; reserva incerta não é reaberta. Grants somenteexecuteService, nenhuma tabela ou função privada pública.

Validar SQL remoto com usuários/sessões/conexões fictícios em BEGIN/ROLLBACK, confirmar ownerpreservado e zero resíduos; testar ACLs/IDOR/capfalse/nonce/duploclaim/replay/expiração/pausa/sessãoremovida/caps/resetnewlease. Não declarar ensaio paralelo real: atomicidade vem dos locks/condições SQL, fixture cobre ordens sequenciais. Checks Python do runner e suíte; aplicar versão imutável por runner próprio após revisão/CI, sem valores bancários.

Fontes primárias: [locks PostgreSQL17](https://www.postgresql.org/docs/17/explicit-locking.html) e [SHA256 builtin](https://www.postgresql.org/docs/17/functions-binarystring.html). Locks se encerram com a transação; não representam transação distribuída com a Pluggy. Próxima prova de sessionId/RESTports/coordenadorHTTP.

Validação prévia: DDL+fixtures no mesmo BEGIN/ROLLBACK pelo Management API próprio, antes de publicar migration; confirmar ausência da tabela temporária e de identidades de teste, owner preservado. Isso permite corrigir fixture/DDL antes de tornar a migration imutável.
