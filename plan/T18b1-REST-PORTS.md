# T18b1 — Portas REST Auth/metadados

Estado: done. MPG-02/03/09/10, SEC-05/07/12. Depende T18a/T13. Integrador único.

## Decisões

Sem novo SDK. Origem https://<ref20>.supabase.co e sb_publishable_ estritas; sem PAT/service role/URL arbitrária. GET /auth/v1/user verifica token remotamente, seguido de POST /rest/v1/rpc/orbe_is_owner {}. Conferir subject JWT com user.id, issuer do projeto, aud/role authenticated, exp válida; claims locais não autenticam. Usuário anônimo negado. Listagem GET /rest/v1/orbe_connections com projeção explícita estática, order created_at.desc,id.desc e limit101 (core rejeita>100). RLS por Bearer e apikey pública.

Alterar assinatura interna listConnections(subject,signal,token) para passar credencial da própria requisição explicitamente. Não armazenar token validado em variável global/lastSession/cliente compartilhado; validar concorrência e mesmo token em todos os headers. Subject não entra na URL, row owner validado pelo core. Corpo upstream limitado128KiB por streaming, JSON/UTF8 estritos, cancelamento/redirect error/credentials omit/cache no-store. Não aceitar destination vinda de dados. Sem chamadas reais nesta task.

Paths: spec009, este plano, supabase/functions/_shared/bridge.ts e supabase-rest.ts, tests/bridge/rest.test.mjs e handler.test.mjs, package.json, docs/security/BRIDGE-CORE.md, tasks/TASKS.md, roadmap/STATE.md, AGENTS.md.

## Aceite

Matriz configuração inválida, JWT falso/expirado, user divergente/anônimo, RPC false/erro, metadata resposta inválida/limite/redirect/cancelamento; nenhum erro bruto, credencial em URL ou service role. Duas sessões concorrentes mantêm mesmo token por cadeia. Typecheck cliente/ponte e suíte completa. Runtime Deno/HTTP real/deploy continuam T18b2; nenhum endpoint criado.

## Fontes primárias revistas em19/10/2026

[Auth getUser](https://supabase.com/docs/reference/javascript/auth-getuser): verificação por chamada ao servidor Auth. [Segurança Data API](https://supabase.com/docs/guides/api/securing-your-api): grants limitam objetos e RLS limita linhas; RPC exige revisão própria. [Edge Functions](https://supabase.com/docs/guides/functions/auth): chave de projeto não é sessão de proprietário. Escolha do adapter REST e controles adicionais são decisões do Orbe, não garantia automática da documentação.

## Resultado

Typecheck cliente/ponte e272 testes passaram,17 novos REST/concorrrência. Sem chamadas Auth reais, publicação de função ou consulta bancária. Interface de metadata agora recebe token explícito da mesma requisição. Próxima fatia independente T33a guia/UI desconectada, sem aguardar credenciais de fornecedor. T18b2 runtime/deploy ainda pendente.
