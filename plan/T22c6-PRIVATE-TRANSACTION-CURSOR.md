# T22c6 — Cursor privado autenticado

EXP-17/SEC-24; dependeT22c1–c5, base18f9e23; integrador único. Paths: specs003, supabase/functions/_shared/transaction-cursor.ts, tests/bridge/transaction-cursor.test.mjs, scripts/bridge-deploy.py(allowlist), package.json, TASKS/STATE/decisões. Semcliente/entrypoint/chave/env/migration/deploy.

Porta backendseal/open/close: escopoautorizado capturado, key32bytes de getter separado, AESGCM/nonce12bytes/tag16, payloadcompacto{a,w,n}, AADdomíniov1+owner/sessão/lease/revisão/mês/item/manifesto. Validar UUID/ordem/duplicatas/window/next, clockmonotônico e expirymáximo120s; disabled não toca input/key/crypto. Seal emite sótoken até512, open interno retorna posição privada após validaçãoGCM/JSON/builder; nextgrande falha semtruncamento. Nãoalegar anti-replay global, confirmação de ownership ou progresso pela criptografia.

Testarroundtrip/IValeatório/crossowner/sessão/lease/manifesto/key/tamper, expiração/rollback/closeemawait, queryhost/filtrosconta/índices, cursorgrande/canonicidade e ausência de valoresprivados na saída pública. Check/suite/allowlist/scans e checkpoint. Próxima composição de transporte/coordenador com Auth/sessãoconfirmada/lease/progresso/decoderantecipado/abort/DTOmínimo.
