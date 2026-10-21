# T22c4 — Orçamento finito da página transacional

EXP-16/SEC-12; dependênciaT22c3, base73481c7; integrador único. Paths: specs003, supabase/functions/_shared/exact-json.ts/http-json.ts, tests/bridge/exact-json.test.mjs, TASKS/STATE. Semcaller/entrypoint/flags/deploy/client.

Adicionar perfil enumtransactions1MiB ao decoder exato, standard128KiB preservado. Extrair leituraHTTPbounded interna e export dedicado de transações cap1MiB/decoderobrigatório, mantendo API/default/teto128KiB do leitor existente. Validar500fixtures comextras >128KiB e integração projeção, bytesUnicode/boundary/depth64/overflow/abort/MIME/probe e sem JSONlossyfallback. Suite/typechecks/scans; não repetir export/deploy por módulo isolado. Próxima transporte privado/cursor autenticado com binding/lease/deadline e preparação antecipada do decoder.
