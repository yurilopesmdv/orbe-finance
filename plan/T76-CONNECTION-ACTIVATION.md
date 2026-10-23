# T76 — Fluxo de ativação preparado sem fabricar evidência

## Escopo e dependências

Titular confirmou OpenFinance nos dois bancos e autorizou continuidade. T75 preparou configurações e revelou uma divergência de associação na API. Isso não impede implementar agora o fluxo de ativação que faltava. Integrador único; sem agentes. Liberação pessoal autorizada em21/10 conforme docs/security/OWNER-RELEASE-20261021.md; fixtures positivas não homologam a cobertura de valores.

| Etapa | Paths | Aceite |
|---|---|---|
| a — evidência e transição SQL | activation-evidence.ts, migration18, fixture/admin | Proxy→consentimento→item original OF verificável, instituição coincidente, permissõesOF, produtos delimitados; owner/sessão/revisão atuais, descoberta concluída, transição atômica e sem replay |
| b — API protegida | activation-rest/handler/provider/network/runtime | Authduplo, body sóconnectionId/revision, evidência não vem do cliente, destino fixo, no-store/deadline, associação original verificada; divergência sem origem válida negada |
| c — ação no app | conexões/gateway/controller/flag | Mostrar motivo objetivo, confirmar resultado por status, sessão/proteção; nenhuma capacidade inferida do clique |
| d — publicação controlada | scripts/release/docs | Guardas de liberação e rollback; kill switch independente, recibo privado e liberação pessoal delimitada. Sem export/redeploy por módulo isolado |

Cada etapa preserva checkpoint e vai à próxima sem esperar autorização entre tarefas. Não parar o trabalho implementável alegando somente lacunas externas. Faltam também os vínculos dos relatórios/classificação ao cache real e homologação física; demonstração não equivale a essas entregas. Cofrinhos dependem de evidência da fonte.

## Contrato de evidência

Consentimento precisa apontar exatamente para o item original buscado a partir da resposta filtrada pelo proxy conhecido. O original deve ser OpenFinance/não sandbox/UPDATED/SUCCESS do banco cadastrado (603Bradesco/606MP). IDs distintos proxy/original são preservados; UUID diferente isolado não basta. Não corrigir identificadores no payload. Produto habilitado e permissãoOF são interseção: contas exigem saldos/listagem, movimentos exigem contas+transações, investimentos permissão específica. Consentimento revogado/expirado/ambíguo, origem declarada sem prova programática ou associação divergente não gera evidência de ativação. Expiração bancária nula só representa prazo indeterminado quando o campo explícito existe no consentimento válido; ausência é desconhecida.


## T76e — correção do fluxo reportado no iPhone

Integrador único. Paths: activation-controller/runtime, my-connections, testes de integração/presentation, guias. Diagnóstico somente técnico confirmou pending/rev1/sem inventário. Aceite: ação única prepara antes de ativar, falha não avança, cooldown nunca substitui validaçãoSQL, status só afirma ativo após releitura; bloqueio cancela; prazo abrange ambas etapas. Publicar novo cliente após tipos/testes/export/audit/scans/CI; backend/regraSQL preservados.
