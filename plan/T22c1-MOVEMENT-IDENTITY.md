# T22c1 — Identidade interna de movimentos

EXP-10/13, SEC-07/12/24 e ADR-017. Dependências T22a/b e c42; baseffe7fb5, integrador único. Paths: specs003, decisões, supabase/functions/_shared/movement-identity.ts, tests/bridge/movement-identity.test.mjs, scripts/bridge-deploy.py (allowlist apenas), package.json, TASKS/STATE. Nenhum cliente/entrypoint/env/segredo/deploy.

Implementar porta pura assíncrona HMACWebCrypto: gate, escopo capturado owner/account, chave32bytes de getter backend importada uma vez nãoexportável, inputUUID, UUIDv8, erros genéricos e close que descarta resultados tardios. Contexto inválido não lê chave; concorrência compartilha importação. Testar vetor conhecido independente, determinismo/separaçãoowner/conta/chave, mesma conta após renovação, UUIDformato, gateszeroacesso, config inválida/errocríptico/closeemawait, entradaalterada/escopocapturado e superfície sem segredo. Typechecks/suite/scans/allowlist, sem export cliente ou publicação.

Aceite: contratos locais podem receber UUID interno estável sem ID de provedor/segredo no DTO, nenhuma rede ou alegação de ownership pela derivação. Próxima T22c2 projeção mínima do payload de movimentos conforme API oficial e janela/moeda/direção/cursor, ainda sem roteamento real.
