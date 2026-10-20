# T51b2c18 — Aplicador privado do inventário

MPG-33. Integrador único. Depende MPG-31/32. Paths: provider-items.py, novo stage-provider-items.py, tests/admin/provider_staging_test.py, package.json, spec009/TASKS/STATE/ACCOUNT-ACTIVATION. Sem deploy financeiro.

1. Expor leitura privada validada sem alterar saída redigida do inventário.
2. Implementar check offline e stage com projeto fixo, hash de migrations, chave em memória e RPC literal somente pending.
3. Testar destinos/IDs só no body, ausência de rede no check, validação total prévia, falha/limite/redação.
4. Rodar checks/scan; registrar somente staging de metadados com o item fornecido pelo titular, sem coletar valores.

Aceite: nenhuma chamada Pluggy/financeira, nenhum ID ou segredo em stdout/Git/SQL, conexão permanecepending sem capacidades/OF. Bradesco ainda não confirmado na aplicação. Falha parcial é possível em múltiplos itens e fica pendente para retomada idempotente; não afirmar atomicidade global.
