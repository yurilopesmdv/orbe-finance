# T51b2c41 — Scan completo antes da publicação

SEC-22a; dependência c40, integrador único, basede577c2. Paths: scripts/publish-preflight.py, scripts/eas-safe.mjs, tests/admin/publish_preflight_test.py, package.json, specs006, TASKS/STATE e docs/DESENVOLVIMENTO.md. Não alterar lock, cliente, backend ou gates.

Reutilizar private_canaries/private_values existentes em helper offline, ler export binário em blocos com sobreposição e rejeitar symlink/arquivo especial/perfis inválidos. Não retornar filename, trecho ou valor. EAS wrapper chama o helper com ambiente restrito sem token antes de lançar CLI autenticada; falha fechada em qualquer erro. Fixtures isoladas cobrem segredo de cada perfil, divisão de bloco, symlinks, arquivo especial e retorno redigido, sem leitura dos perfis reais. npmcheck/sintaxe/preflight real sem upload; sem novo export por alteração administrativa. Registrar resultado, scan fonte e commit/push.

Aceite: export contendo qualquer canário conhecido não chega ao subprocesso publicador, o export atual passa sem rede. Não prometer detectar todo dado pessoal possível nem eliminar risco externo.
