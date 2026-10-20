# T18b3b2a — prefixo de rota gerenciada

20/10/2026. MPG-12b; integrador único, depende T18b3b1. A revisão oficial identificou que paths internos devem conter o nome da função. O core isolado usava /connections/status; publicar sem adaptação produziria404.

Implementar opção interna literal statusPath no core (default antigo), capturada no boot. Factory metadata usa /orbe-metadata/connections/status. Não reescrever request, preservar stream e cancelamento. Limitar opção em runtime aos dois valores conhecidos, falhar503 para configuração inválida. Testar owner positivo sintético no novo caminho, ausência Bearer e recusa de caminhos ambíguos, queries, outra função e sufixos antes de rede. Atualizar hostmock.

Paths: core/factory/testes runtime/entrypoint, spec/plano/checkpoints. Aceite check completo sem deploy. Próxima T18b3b2b helper/configuração/manifest e HTTP gerenciado.

Fontes oficiais consultadas20/10/2026:
- https://supabase.com/docs/guides/functions/routing — prefixo do nome da função.
- https://supabase.com/docs/guides/functions/secrets — configuração Deno.env, SUPABASE_URL injetada, nomes personalizados não usam prefixo reservado; valores novos chegam sem redeploy, mas nossa factory captura no boot, não prometer cutoff de instância imediata.
- https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys — verificação própria de sessão quando gateway legacy não cobre chaves modernas; usar Auth remoto+RPC, não decodificação isolada.
