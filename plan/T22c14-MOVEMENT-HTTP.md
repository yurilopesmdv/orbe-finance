# T22c14 — Coordenador HTTP de movimentações

SEC-31; dependeT22c13. Integrador único. Paths: movement-handler.ts, tests/bridge/movement-handler.test.mjs, package.json, allowlist, spec006, TASKS/STATE.

Auth owner/sid→bodyestrito→resolver/bindings/lease→claimhash→portmovimentos→reAuth mesma sessão→resolver estável→commithash/receivedRows→DTO whitelist.20s/abort/no-store e1MiB de saída. Testar end-to-end fictício, IDOR, sessão/lease/capacidade, cursor, consentimento, claim/commit recusados e timeout. Não ligar runtime/deploy/flags/chaves. Finalização do lease global e cliente serão microtasks próprias.
