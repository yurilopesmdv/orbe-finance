# T13 — Vínculos de conexões e contas

Estado: done, 19/10/2026. OF-05/PORT-05/AUTH-02. Dependências T08/T04; contrato T10 implementado. Responsável sequencial. Paths migration nova, tests/admin/metadata-access.sql, backend-admin.py, package.json e checkpoints.

public.orbe_connections/orbe_accounts guardam somente metadados mínimos sem payload. RLS e grants permitem apenas SELECT do dono permitido; nenhum cliente escreve. Identificadores externos em orbe_private.connection_bindings/account_bindings, sem USAGE de anon/authenticated. FKs compostas impedem referência cruzada; service_role tem grants explícitos mínimos para ponte futura, nunca exposto no cliente.

Instituições enumeradas, estados claros, capacidades nullable, data de Open Finance obrigatória para active. Nenhuma conta real/vínculo real será criado. Teste transacional com dois usuários inventados cobre leitura/join/agregado, escrita indevida, privado inacessível, FK cruzada e estado inválido; rollback e ausência de resíduos. Conferir imutabilidade e reexecução das migrations no destino Orbe. TypeScript/suíte local; RLS real opt-in separado da CI.

## Evidência

Migration 20261019200000 aplicada; três hashes remotos conferidos em reexecução sem duplicar. SQL real test-metadata validou dono/leitura/join/agregado, segunda identidade/anon negados, INSERT/UPDATE/DELETE cliente negados, IDs externos privados, FK cruzada e item duplicado negados, active sem Open Finance negado, null distinto de false. Rollback conferiu zero identidades temporárias e proprietário original preservado. TypeScript e165 testes locais passaram; RLS real não faz parte da contagem da suíte/CI. Nenhum vínculo/conta/valor bancário real criado.
