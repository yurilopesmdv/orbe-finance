# T22c11 — Sessão Auth confirmada no contexto interno

SEC-28/EXP-20; dependeT22c10, basebd68570; integrador único. Paths: specs006, supabase/functions/_shared/supabase-rest.ts, tests/bridge/rest.test.mjs, TASKS/STATE. Sem cliente/DB/boot/env/deploy.

Capturar session_id próprio/UUID36 do JWT como precheck, mas só anexar sessionId ao retorno interno depois de GetUser+orbe_has_session aprovados e expiração revalidada. Preservar ausência de sid em casos legados e omitir para ownerfalse. Recusar sid presente inválido cedo; não usar user_metadata. Testar Authrecusa/RPCfalse/malformação/privacidadeHTTP/retornoconfirmado/legadocompatível. Check/suite/scan/diff e checkpoint. Próxima resolver transacional service-only com sessão e snapshotLeaseExpiry e RESTports de claim/commit.
