# T18b3b2b — publicar status autenticado

20/10/2026. MPG-12c/SEC-02/05/12/21; integrador único. Dependências factory/entrypoint/routing/T51d concluídas.

Paths: scripts/metadata-deploy.py, testes admin, config.toml, package.json, specs/checkpoints. Reutilizar artifacts do deploy off sem ampliar permissão de sua função. Validar .env.local apenas URL/chave pública/recovery e correspondência ao projeto próprio. CLI Supabase2.121.0 offline, ambiente mínimo, credenciais administrativas só em env subprocesso/log0600 fora projeto. Arquivo de configuração remota contém somente duas variáveis públicas/control; remover ao terminar.

Guardas: rejeitar symlink/manifest inexistente para função existente/drift/missing/URL diferente/config extra. Manifest separado metadata-deploy.json por id/version/hashes. Preflight antes de set de configuração. Sequência setfalse→deploy→verify/manifest→settrue→redeploy→verify/manifest→HTTP negativo e smoke financeiro off. Não ler servicekey, JWT do proprietário ou fornecedor. Modo smoke só lê/testa e não muta.

Aceite local check completo, guards negativos e caminho de deploy em mock; real ACTIVE/erros genéricos HTTP e financeirooff. Não declarar Auth positivo/físico ou dados reais homologados. Se falta de permissão/token, continuar tarefas independentes, preservar checkpoint.

Fontes oficiais20/10/2026: https://supabase.com/docs/guides/functions/secrets (secrets set --env-file, Deno.env, configuração de projeto); https://supabase.com/docs/guides/functions/routing (prefixo); https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys (gateway legacy e verificação no handler).
