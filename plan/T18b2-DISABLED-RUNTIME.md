# T18b2 — Runtime com ponte desligada

Estado: done. MPG-09/10/11, SEC-10/11/12. Depende T18a/b1/T50. Integrador único.

## Decisão

Entrypoint ESM index.mjs usa Deno.serve + createBridgeHandler com enabled:false literal e ports que falham se tocados. Nenhuma leitura de env/segredo/config/adapter. JS evita inventar tipos Deno para typecheck Node; validar sintaxe/host fake local e execução real no runtime gerenciado. Deno CLI local permanece ausente; isso não é homologação do adapter ativo.

Supabase CLI2.121.0 já utilizado, resolvido offline, functions deploy orbe-bridge --use-api --project-ref explícito, sem Docker/link/prune/secretset. verify_jwt=false permite validar kill switch503 anônimo; handler permanentemente desligado, sem qualquer leitura protegida. É proibido habilitar função por variável; etapa futura requer revisão código/gates e auth end-to-end.

Helper próprio confirma projeto Orbe por API, aceita somente arquivos-fonte conhecidos de functions, recusa symlinks/segredos, origem de deploy divergente e função existente sem manifest privado. Captura CLI em log0600 fora Metro; envia PAT somente por env do filho administrativo com allowlist, nunca argumentos. Manifest hash/version/slug no diretório privado. Smoke HTTP anônimo sem apikey/token, POST{} GET e query inventada exigem503/no-store/exato erro genérico. Não contratar/plano/custo novo, nem banco real.

Paths: spec009, este plano, supabase/functions/orbe-bridge/index.mjs, supabase/config.toml, scripts/bridge-deploy.py, tests/bridge/entrypoint.test.mjs, package.json, docs/security/BRIDGE-CORE.md, tasks/TASKS.md, roadmap/STATE.md, AGENTS.md.

Aceite: check cliente/ponte/sintaxe/hostmock e smoke real somente desligado, metadataManagementconfere função ACTIVE/verify_jwt=false. Logs/manifest externos, sem rawAPIoutput. Nenhum recurso/segredo do F1 acessado; zero itens bancários. Próxima task continua sintética se gates do fornecedor/runtime real pendentes.

Fontes oficiais revistas19/10: [CLI deploy](https://supabase.com/docs/reference/cli/supabase-functions-deploy) confirma use-api sem Docker; [API deploy](https://supabase.com/docs/reference/api/v1-deploy-a-function) documenta permissão edge_functions_write; [deploy](https://supabase.com/docs/guides/functions/deploy) e [auth](https://supabase.com/docs/guides/functions/auth) distinguem camada gateway e handler. Garantias adicionais são contratos Orbe e dependem dos testes.

## Evidência

279 testes/typecheck cliente+ponte aprovados; função versão1 ACTIVE/verify_jwt=false e três smokes HTTP503/no-store/exato erro confirmados. Sem env/auth/DB/provedor no entrypoint, Deno local permanece ausente e Docker parado. Não valida adapter ativo. Próxima T59a filtros por conta/tipo/contexto acessível na demo.
