# Diagnóstico da ativação — 23/10/2026

## Falha corrigida

O botão antigo permitia ativar antes da preparação. No relato de21/10, a conexão continuava pending, revisão1 e capacidades desconhecidas. A inspeção de23/10 confirmou inventário registrado com sucesso pelo backend usando a Pluggy; as duas chamadas SQL de ativação ocorreram90s e44s antes desse registro. Portanto não era necessário refazer as credenciais nem atribuir a falha ao provedor. O inventário posteriormente encontrado estava fora da validade de15min para ativação.

A ação **Preparar e ativar leitura** agora identifica as contas e só depois verifica o consentimento/ativa. Falha na preparação impede a próxima etapa. Cooldown pode corresponder a inventário recente já registrado; nesse caso a ativação ainda depende da checagem SQL de conclusão, revisão e validade. O cliente não fabrica capacidades ou aprovação. O resultado só é apresentado como ativo após releitura do status. Segundo plano, bloqueio ou perda da sessão interrompem ambas etapas.

## Como interpretar a tela

- Em preparação/Ainda não confirmado: o vínculo existe, mas a ativação ainda não foi confirmada; não significa que a fonte tenha informado saldo zero.
- Preparando contas: identificadores técnicos estão sendo verificados. Nenhum valor é mostrado nessa tela.
- Verificando ativação: o inventário foi preparado; o servidor está verificando origem/consentimento e sessão.
- Prazo indeterminado: consentimento bancário com expiresAt explicitamente null e origem já comprovada. Não é data ausente.
- Última leitura não informada: nenhuma leitura de valores foi concluída; ativação sozinha não é uma consulta de saldos.

## Diagnóstico administrativo seguro

Não consultar corpos de requisição/resposta, valores, descrições, tokens, IDs externos, IPs ou mensagens brutas dos logs. O diagnóstico usa somente instituição/estado/revisão, booleanos de inventário, resultado técnico e contagens de status HTTP por rotas fixas. Datas técnicas são correlacionadas em memória; no relatório ficam intervalos, sem IDs. Não impersonar a sessão do titular nem chamar uma leitura financeira por ferramentas para testar.

A API atual de logs usa `/analytics/endpoints/logs`, SQL ClickHouse e janela explícita de até24horas. Projetar somente operações conhecidas/status/contagem; nunca `select *`, headers ou event_message. Consultas vazias fora da retenção não provam ausência de falha. Referências: [API de logs](https://supabase.com/docs/reference/api/v1-get-project-logs), [consultas SQL](https://supabase.com/docs/guides/observability/advanced-log-filtering).

O validador técnico real foi reexecutado em23/10: origem Mercado Pago Open Finance e permissões de contas/transações/investimentos confirmadas; zero leituras financeiras pelas ferramentas. Isso não confirma a primeira ativação/saldo no iPhone. A conexão Bradesco ainda exige identificação do proxy próprio na aplicação. Não duplicar o item Mercado Pago ou preencher capacidades manualmente.

[Guia vigente](ACCOUNT-ACTIVATION.md) · [Prontidão](RELEASE-READINESS.md) · [Estado de retomada](../roadmap/STATE.md).
