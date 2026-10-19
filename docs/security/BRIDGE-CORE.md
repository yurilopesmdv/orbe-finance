# Núcleo da ponte — T18a

`supabase/functions/_shared/bridge.ts` é um núcleo sem entrypoint publicado e sem SDK/adapter externo. Não existe função acessível remotamente por essa implementação. `createBridgeHandler(ports)` permanece desligado:503 genérico, sem tocar request/body/auth/metadados/clock. Habilitação explícita nos testes é somente sintética. Flags do app continuam false.

Única rota local POST /connections/status, JSON {}, Bearer em header; query/IDs/URL externa/campos livres recusados. O token é opaco para o núcleo: porta authenticate deve verificar sessão no projeto correto, autorização orbe_is_owner e expiração. Identidade é fixada em escalares antes de awaits. Não há confiança em owner fornecido pelo cliente. Este teste de porta não prova JWT real; adapter deve ser homologado separadamente.

Porta listConnections retorna somente linhas sob autorização/RLS. Núcleo recusa owner divergente, ID inválido/duplicado, revisão não segura, enum/capacidade/data inválida e active sem evidência OF. Projeta campos explícitos sem owner/item externo/PII/extras. Datas normalizadas UTC, null preservado, máximo100 conexões no endpoint não paginado. Isso não prova cobertura de instituição/produto.

Corpo limitado16KiB por bytes reais, UTF-8 estrito, sem confiar content-length. Prazo total20s desde início da autenticação; abort cancela leitura e signal às portas. Autenticação tardia não inicia próxima etapa; resultado tardio não publica dados. Adapter deve respeitar signal para encerrar rede; core não consegue desfazer operação externa já executada. Cabeçalhos no-store/nosniff, erros enumerados genéricos, sem console, cookies ou CORS genérico.

Validação:21 cenários HTTP locais, `npm run typecheck:bridge` separado do cliente e executado por `npm run check`/CI. Total255 testes; fixtures inventadas. Deno ausente, sem deploy, chamadas bancárias ou validação de runtime Edge. Próxima T18b1 prepara adapters REST Auth/metadados com origens fixas e testes de rede simulada; T18b2 valida runtime/deploy desligado. T18c/fornecedor/OF/gates continuam pendentes.

## T18b1 — Portas REST

`supabase-rest.ts` materializa Auth getUser, RPC orbe_is_owner e select explícito de orbe_connections, com origem Supabase e chave pública restritas. O token é recebido novamente na porta de metadata a partir do Bearer da requisição atual; não existe lastToken/cache/estado de sessão compartilhado. RLS é exercida como usuário, sem service role. Claims são apenas precheck estrutural/expiração; confiança depende de Auth remoto, user.id correspondente e RPC booleana. API pública da factory é interna ao backend.

Transport exige redirect error/credentials omit/no-store. URLs são constantes por enum de endpoints; IDs/JWT não entram em query. JSON/UTF8 upstream limitado128KiB, signal e expiração rechecados entre etapas.17 testes novos simulam rede, inclusive Auth recusando token com claims válidas, RPC false, owner divergente, duas sessões concorrentes, abort, limite e erros. Total272 testes/TypeScript cliente+ponte passaram. Nenhum usuário real consultado nesta task, nem runtime Deno/deploy validado.

Base documental e distinção entre garantia externa e decisão própria em [plano T18b1](../../plan/T18b1-REST-PORTS.md). T18b2 permanece para HTTP/runtime/deploy desativado; antes dela pode avançar UI desconectada T33a sem depender de servidor.
