# T19b1 — Autorizações do proxy e do banco

Estado: done. OF-03/08/14, MPG-04/05/08. Prioridade encontrada na revisão pública antes de T20b2. Integrador único.

## Evidência externa e limite

O guia pessoal documenta autorização de um ano no proxy e expiração separada do consentimento bancário. Após vencer, leituras podem ficar vazias enquanto o último status ainda é UPDATED; renovar pode mudar itemId. Isso é comportamento documentado, não homologação observada. [Fonte primária revista19/10](https://docs.pluggy.ai/en/docs/guides/meu-pluggy-personal-use). Não acessar banco/conta do titular nem tratar o proxy como sandbox.

## Implementação do Orbe

Nova migration20261019220000_split_consents.sql, imutável após aplicar: guard exige connections vazia para não reclassificar dados existentes sem prova; renomeia authorization_expires_at→proxy_consent_expires_at e acrescenta bank_consent_expires_at nullable. Não retropreencher datas. Substituir helpereligibility/triggerfence para dois campos; proxy desconhecido/expirado ou banco sabidamente expirado negam RPC. Demais funções/grants/quota permanecem.

Bridge projeta proxyConsentExpiresAt/bankConsentExpiresAt e mantém authorizationExpiresAt derivado como menor prazo conhecido; select REST usa colunas novas. Client normalizer usa campos explícitos: prazo proxy desconhecido bloqueia com motivo; passado em qualquer uma vira renewal_required. Não confiar no alias legado fornecido nem gerar prazo somando um ano. Atualização dessas evidências deve acontecer antes de coleções na integração futura. Não mapear outros campos/status do fornecedor por hipótese.

Paths: spec002, este plano, nova migration, _shared/bridge.ts/supabase-rest.ts, src/domain/connections.ts, tests/domain/connections.test.mjs, tests/bridge/handler.test.mjs e rest.test.mjs, tests/admin/read-leases.sql, docs/security/BRIDGE-CORE.md, docs/research/BANK-COVERAGE.md, tasks/TASKS.md, roadmap/STATE.md/ROADMAP.md, AGENTS.md, README.md.

Aceite: proxyunknown/past com stateactive não lê; bankpast bloqueia mesmo com proxyfuture; bankunknown preserva null sem inventar validade; aliaslegacy não concede acesso, menor prazo e revisão corretos. SQL real rollback dos dois prazos/RLS/lease/cascade, owner preservado e zero fakes; typecheck/suíte. Migration antes do cliente; entrypoint publicado continuafalse/v1, sem redeploy. T20b2 posterior, fornecedor originalOF/runtime/gates continuam pendentes.

## Evidência

Migration5 aplicada antes do cliente,6tabelas metadata, sem conexões existentes. TypeScript cliente/ponte e359 testes aprovados,6novos incluindo alias legado e limite ano/fuso. SQL lease/proxy/bank/RLS/owner regressões reais passaram em rollback, zero fakes/owner preservado. Não editar migration aplicada. Sem UI/import novo: export não necessário; função publicada permanecev1off. T20b2 coordenação continua próxima, respeitando consentimentos/normalizadores/gates.
