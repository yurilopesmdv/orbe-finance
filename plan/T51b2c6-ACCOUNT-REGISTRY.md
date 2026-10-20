# T51b2c6 — registry interno autenticado

20/10/2026 MPG-21; integrador único; depende c5/RLSmetadata. Paths lib/session-json.ts, sync/account-transport.ts, connections/account-registry.ts e testes. Extrair HTTP de sessão existente para cliente de operações literais accounts/acquire/finalize/registry, sem aceitar URL. Registry GETcolumnsid,connection_id/limit1001, RLSexistente, valida<=1000/ownUUID/duplicata e filtra conexão em memória. Não coleta owner/finanças/PII. Gatesoffzero e sharedcancel/deadline/401lock; gatewayregression mantém ciclo29c/cachepurge.

Aceite: lista vazia/múltiplasconexões/IDs próprios/imutable/duplicata/overflow/schema/foreignorigin/401/cancel; destino fixo sem IDs/tokenURL e GETsemcorpo. Tests/typechecks/scan/commit/push/CI; sem alterar backend/publicação. Próximo controlador readiness/cache sem dados persistidos e gatesindependentes.

Concluída:793 testes/typechecks,7 casos; regressões end-to-end29centavos/cachepurge aprovadas após extração do transporte. Sem novo endpoint/deploy/QR.
