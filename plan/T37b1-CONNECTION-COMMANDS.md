# T37b1 — Porta cliente de comandos

Estado: done (fixtures/desligado). OF-19/20, AUTH-09/10/12, SEC-05/07/08/12/14. Integrador único; depende T37a/T51c.

## Contrato

createConnectionCommands(session,resolvePublicConfig,transport,policy) retorna métodos pause/remove; enabled/privateDataApproved capturados false por padrão. Off retorna disabled antes de tocar argumentos/ports/config. assertUnlocked antes de entrada/pending, depois SessionModel.read (JWT só no callback interno). Capturar métodos corretos com this da sessão. Entrada exatamente dois campos próprios connectionId/revision (UUID canônico/inteiroseguro>0; pause<MAXSAFE para permitir incremento, remove≤MAXSAFE). Sem coerção/extra owner/flag reauth.

Config resolvida dentro de sessão válida: origem HTTPSSupabaseexata20letters/key sb_publishable primitivas/own e snapshot por chamada; sem token técnico/fallback. Transport obrigatório/injetado, sem fetchglobal automático. Futuro app injeta expo/fetch como AuthProvider; não conectar UI nesta fatia. POST URLsfixas /rest/v1/rpc/orbe_pause_connection ou orbe_remove_connection, body {p_connection_id,p_revision}; Bearer/apikeyheaders, no-store/redirecterror/credentialsomit.

readBoundedJson16KiB, onlyHTTP200literalbool. truecomplete/falsenot_confirmed. 401/403 AuthFailureinvalid_credentials faz SessionModel bloquear; 429rate_limited; restanteunavailable sem ler erro. Cancel/root/deadline20s encerra requests/readers; transporte ignorandoabort nunca interpreta resposta tardia. SessionModel.read transforma erros desconhecidos: operações de negócio retornam status interno, só AuthFailure deve atravessar para invalidar sessão. Busy por instância antes de entrada evita chamadas paralelas. Erros de config/port/contexto nunca ecoados. Resultados congelados somente status.

## Paths / aceite

spec001/002, este plano, src/features/auth/gateway.ts/session.ts, tests/auth/session.test.mjs, src/features/connections/commands.ts, tests/connections/commands.test.mjs, package.json, tasks/TASKS.md, roadmap/STATE.md/ROADMAP.md, AGENTS.md, README.md, docs/security/BRIDGE-CORE.md.

Testes SessionModelgatewayinventado e transporte fake: offzeroacesso/lockednoconfig, corpo/endpoints/headers corretos, token ausente resultado, inputs extras/UUID/revisão, configprimitiva/destinoalterado, boolfalse/JSONmalformed/oversize, bodyerrorcancel/401lock/429, timeout/abort/late/expiry/busy. Typechecks+suite e export iOS/scan de segredos por alteração no gateway/session importados pelo app; sem UI nova/HTTP real/segredo/deploy. T37b2 integração de lifecycle/UI privada posterior; T37c fornecedor.

Revisão durante implementação: capturar origem pública do gateway no SessionModel (getPublicOrigin) e exigir igualdade no comando antes de usar Bearer. Não expor chave/token/subject. Cancelamento não confirma rollback remoto: UI/cachepurge e reconciliação de resultado incerto ficam T37b2.

## Evidência

551 testes/typechecks aprovados (16 novos:14 comandos+2 origemSession); export iOS2.5MB e scan PAT/ownerUUID aprovados. Endpoints/corpos/Bearer fechado, origem ligada ao gateway e cap16KiB/cancel/deadline/busy/401/403/429/expiry validados. Nenhum HTTP com sessão real, nenhuma UI de mutação ativada. Confirmação ausente não prova rollback remoto; T37b2 precisa invalidar cache/refetch.
