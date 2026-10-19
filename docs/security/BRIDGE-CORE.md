# Núcleo da ponte — T18a

`supabase/functions/_shared/bridge.ts` é um núcleo sem entrypoint publicado e sem SDK/adapter externo. Não existe função acessível remotamente por essa implementação. `createBridgeHandler(ports)` permanece desligado:503 genérico, sem tocar request/body/auth/metadados/clock. Habilitação explícita nos testes é somente sintética. Flags do app continuam false.

Única rota local POST /connections/status, JSON {}, Bearer em header; query/IDs/URL externa/campos livres recusados. O token é opaco para o núcleo: porta authenticate deve verificar sessão no projeto correto, autorização orbe_is_owner e expiração. Identidade é fixada em escalares antes de awaits. Não há confiança em owner fornecido pelo cliente. Este teste de porta não prova JWT real; adapter deve ser homologado separadamente.

Porta listConnections retorna somente linhas sob autorização/RLS. Núcleo recusa owner divergente, ID inválido/duplicado, revisão não segura, enum/capacidade/data inválida e active sem evidência OF. Projeta campos explícitos sem owner/item externo/PII/extras. Datas normalizadas UTC, null preservado, máximo100 conexões no endpoint não paginado. Isso não prova cobertura de instituição/produto.

Corpo limitado16KiB por bytes reais, UTF-8 estrito, sem confiar content-length. Prazo total20s desde início da autenticação; abort cancela leitura e signal às portas. Autenticação tardia não inicia próxima etapa; resultado tardio não publica dados. Adapter deve respeitar signal para encerrar rede; core não consegue desfazer operação externa já executada. Cabeçalhos no-store/nosniff, erros enumerados genéricos, sem console, cookies ou CORS genérico.

Validação:21 cenários HTTP locais, `npm run typecheck:bridge` separado do cliente e executado por `npm run check`/CI. Total255 testes; fixtures inventadas. Deno ausente, sem deploy, chamadas bancárias ou validação de runtime Edge. Próxima T18b1 prepara adapters REST Auth/metadados com origens fixas e testes de rede simulada; T18b2 valida runtime/deploy desligado. T18c/fornecedor/OF/gates continuam pendentes.
