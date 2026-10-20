# T51b2b1 — JSON financeiro sem perda numérica

20/10/2026; MPG-14/PORT-04/EXP-05, integrador único. Depende T51b2a e HTTPbounded existente. Paths supabase/functions/_shared/exact-json.ts e http-json.ts (parser interno opcional preserva default), tests/bridge/exact-json.test.mjs, allowlist/package/docs. Sem mudança de cliente/deploy/segredo/SDK.

Probe do context.source em JSON.parse antes de criar decoder. Preservar números como células vazias frozen com literal em WeakMap privado, sem conversão monetária Number. Strings/objetos JSON não forjam proveniência. Profundidade64, UTF8bytes128KiB, literal128chars; scanner leve de delimitadores ignora strings/escapes, sintaxe ainda é validada pelo parser padrão. Inteiros de paginação passam por acessor estrito/limites e safeinteger; financeiro precisa mapper decimal/BigInt na próxima tarefa. Não adicionar biblioteca ou parser caseiro de JSON.

Testar valores acima do safeint/decimais/expoentes/zero/negativo preservados, limite profundidade/stringescapes/literal/corpo e runtime sem context.source. Integração com readJsonResponse deve chamar decoder só depois de MIME/UTF8/tamanho/abort; default Auth/status preservado. Typechecks/suíte/sourceguard. Deno não instalado/localruntime não homologado: futura composição prova capacidade e falha fechada, não liberar finanças em host incompatível.

Fonte primária20/10 https://github.com/tc39/proposal-json-parse-with-source documenta acesso à representação original para evitar perda de precisão. Testar implementação Node22.23.2 instalada não substitui runtime Edge. Próxima T51b2b2 projeção de contas/filtros mínimos e transporte vinculado a owner/sessão/lease em fixtures.

Concluída localmente:723 testes/typechecks,13 casos novos; cópia de fonte preservada e runtime sem suporte negado; default HTTPreader compatível, abort revalidado após callback. Não alegar Deno real homologado ou dados financeiros permitidos.
