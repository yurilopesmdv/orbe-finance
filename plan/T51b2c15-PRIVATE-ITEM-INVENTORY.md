# T51b2c15 — Inventário privado de itens

Requisito MPG-30. Depende de MPG-28 e relato de importação do titular. Integrador único. Paths: scripts/provider-items.py, tests/admin/provider_items_test.py, package.json, spec009, TASKS, STATE e ACCOUNT-ACTIVATION.

1. Preparar init/check offline para ~/.config/orbe-finance/pluggy-items.json.
2. Validar estrutura fechada, IDs distintos e controles de arquivo; saída apenas contagem/readiness.
3. Testar incompleto, duplicatas, JSON ambíguo, permissões e links; regressão do perfil de credenciais.
4. Criar template privado sem sobrescrever, registrar checkpoint e versionar.

Aceite: nenhum ID privado em saída/Git, provider_calls=0, init preserva arquivo existente, malformed falha fechado. Não é provisionamento SQL nem liberação financeira. Próxima fatia: desenho do provisionamento autenticado e descoberta mínima por item, sem valores nas ferramentas e sem listagem global; revisar gates antes de qualquer rede.
