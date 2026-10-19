# T20b1 — Portas REST para lease

Estado: done. OF-12/13, SEC-05/07/12; depende T20a/T18b1. Integrador único.

## Decisão e paths

Factory em supabase/functions/_shared/lease-rest.ts recebe resolveConfig lazy e opções enabled/privateDataApproved, ambas false por padrão. Desligado não resolve config/transport/clock/contexto. Habilitado somente fixtures locais, origem Supabase20 + sb_secret string primitiva. Somente apikey no POST RPC begin/check/finish, JSONp_* conhecido, sem Bearerusuario ou segredo em URL. Nunca ambiente Expo. Não pegar chave real, gravar secrets ou redeploy nesta task.

Extrair leitor JSON/UTF8 bounded já testado de supabase-rest.ts para _shared/http-json.ts (default128KiB Auth; lease16KiB), preservando comportamento. Endpoints por enum, signal/redirecterror/credentialsomit/cache no-store e timer20s com cleanup; Promise.race impede travamento mesmo se transporte ignora abort. Validar scopes/UUIDs/revisão/nonce/produto/outcome antes do request. Snapshot de escalares impede troca concorrente ou mutação. Projeção acquirestatus/grant/cooldown e check/finish booleanos; rejeitar grantfora da revisão, expirado, timestamps inválidos, payload excessivo.

Paths: spec002, este plano, _shared/lease-rest.ts/http-json.ts/supabase-rest.ts, tests/bridge/lease-rest.test.mjs/rest.test.mjs, scripts/bridge-deploy.py(ALLOWEDfontes), package.json, docs/security/BRIDGE-CORE.md, tasks/TASKS.md, roadmap/STATE.md/ROADMAP.md, AGENTS.md, README.md. Não alterar migration aplicada.

## Aceite

Gateszeroacesso, configuraçãoestrita/semJWTlegacy, headers/bodyconstantes, ausência de segredo/UUID emURL, scopes/leasegrant inválidos, booleanos/timeout/cancel/bodylimite/redirect/erros e duas conexões concorrentes. Suíte/TypeScriptcliente+ponte, guardas de upload continuam válidas com fontes conhecidas. Não afirmar adapterativo/HTTPreal ou integração financeira. T20b2 coordenação de paginação é próxima.

Fonte oficial19/10: [API keys](https://supabase.com/docs/guides/getting-started/api-keys) recomenda chaves modernas no apikey e distingue secret(service_role) de sessão. Escolha de só sb_secret, gates e limites são política do Orbe. RLSnão protege segredo privilegiado; autorização já deve ter ocorrido na ponte, e RPCSQL também confere dono registrado/linha/revisão.

Grant deve respeitar TTL máximo180s com skew60s e nextread-expiry780s da política120/900; cooldown retornado futuro até960s. Isso impede aceitar metadata contraditória e não é SLA do fornecedor.

## Evidência

TypeScript cliente/ponte e353 testes passaram,17novos lease e1config primitiva. Testes de guardas de upload passaram com5fontes allowlisted. Sem chave real, HTTP real, redeploy, dependência nova ou mudança de UI; export desnecessário. Próxima T20b2 coordenação de lote com fixtures e preservação de último válido.
