# T51b2c16 — Staging de conexões sem ativação

MPG-31, depende MPG-18/30. Integrador único. Paths: nova migration20261020150000, tests/admin/account-bindings.sql, spec009/TASKS/STATE. Não consultar fornecedor nem ler dados financeiros.

1. Criar RPC privilegiada com owner fixo/lock, escopo Bradesco/MP e conflitos fail-closed.
2. Manter estado pending/capacidades e evidências desconhecidas; repetição exata não altera conexão.
3. Estender SQL rollback com cenários de permissão, não-owner, duplicação e não reativação.
4. Executar checks locais e aplicar migration/testar apenas identidades inventadas no projeto próprio; verificar owner e resíduos pelo runner existente.

Aceite: clientes não executam RPC, nenhum item real provisionado/testado pelas ferramentas, nenhum dado financeiro persistido ou consultado. Próxima etapa: aplicador privado validado do inventário, com retorno redigido e sem substituir vínculos, separado da aprovação/ativação.
