# T51b2c21 — Registro atômico do inventário mínimo

MPG-36. Integrador único. Depende MPG-31/35. Paths: migration20261020170000, tests/admin/account-bindings.sql, spec009/TASKS/STATE. Nenhum endpoint do provedor/deploy financeiro.

1. Criar RPC service-only para pending/revisão/item/ownerfixo, com validação de lista completa antes das escritas.
2. Preservar IDs internos e moeda, não excluir ausentes nem marcar capacidades ou OF.
3. SQL sintético valida IDOR/estado/revisão/item/invalidezatômica/repetição/conflito/nenhumaPII/privilégios.
4. Aplicar migration no projeto próprio, testar rollback/owner/resíduos pelo runner existente e versionar.

Aceite: UUIDinterno independente deIDexterno, não há mudança de estado ou financeira; registro de dados reais não executado. Próxima etapa adaptador REST restrito e coordenador autorizado de descoberta, com gates existentes preservados.
