# T51b2c9 — consentimento upstream atual

20/10/2026 MPG-25; integrador único. Dependências c1-c8; paths _shared/pluggy-item.ts, pluggy-auth.ts, fixtures de transporte e allowlist/docs. Fonte https://docs.pluggy.ai/en/docs/guides/meu-pluggy-personal-use e https://docs.pluggy.ai/en/reference/items/items-retrieve. Gate técnicoMeuPluggy não prova origemOF; original permanece verificação própria. GETitem com mesma chave/host antes de GETaccounts, valida id/status/consentimento futuro/contas/noerror/warnings/actions e extrai apenas lastUpdatedAt/expiry. Revalidar expiry no final. Prazo20s cobre tudo; falha antes de accounts, sem refresh/retry/persistência/log/PII.

Aceite expired/null/missing/past/invaliddate/wrongitem/erro/warnings/sandbox/nonproxy/produto negados; UPDATEantigo+empty não autoriza, consentexpira duranteaccountsdescarta; canáriosPII não saem; auth/item/accounts literal total3calls, cancel/close/deadline existentes; HTTP→client→cache regressões. Typechecks/suíte/scan/commit/push/CI. AppUIexportc8 aguardando publicação final, nenhum backendreal/deploynesta fatia. Próxima preparar runtimeEdge e configuração privada/ativação conjuntamente, após gates.

Concluída:817 testes/typechecks,7 novos cenários e regressões completas HTTP→cache. Expiração duranteaccounts descarta dados; resposta de item só retorna expiry/source internas, não identidade. Sem deploy/realcalls.
