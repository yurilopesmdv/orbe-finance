# Núcleo da ponte — T18a

`supabase/functions/_shared/bridge.ts` é um núcleo sem SDK externo. T18a foi validada localmente; T18b2 publicou depois somente o entrypoint permanentemente desligado, descrito abaixo. `createBridgeHandler(ports)` permanece desligado:503 genérico, sem tocar request/body/auth/metadados/clock. Habilitação explícita nos testes é somente sintética. Flags do app continuam false.

Única rota local POST /connections/status, JSON {}, Bearer em header; query/IDs/URL externa/campos livres recusados. O token é opaco para o núcleo: porta authenticate deve verificar sessão no projeto correto, autorização orbe_is_owner e expiração. Identidade é fixada em escalares antes de awaits. Não há confiança em owner fornecido pelo cliente. Este teste de porta não prova JWT real; adapter deve ser homologado separadamente.

Porta listConnections retorna somente linhas sob autorização/RLS. Núcleo recusa owner divergente, ID inválido/duplicado, revisão não segura, enum/capacidade/data inválida e active sem evidência OF. Projeta campos explícitos sem owner/item externo/PII/extras. Datas normalizadas UTC, null preservado, máximo100 conexões no endpoint não paginado. Isso não prova cobertura de instituição/produto.

Corpo limitado16KiB por bytes reais, UTF-8 estrito, sem confiar content-length. Prazo total20s desde início da autenticação; abort cancela leitura e signal às portas. Autenticação tardia não inicia próxima etapa; resultado tardio não publica dados. Adapter deve respeitar signal para encerrar rede; core não consegue desfazer operação externa já executada. Cabeçalhos no-store/nosniff, erros enumerados genéricos, sem console, cookies ou CORS genérico.

Validação:21 cenários HTTP locais, `npm run typecheck:bridge` separado do cliente e executado por `npm run check`/CI. Total255 testes; fixtures inventadas. Deno ausente, sem deploy, chamadas bancárias ou validação de runtime Edge. Próxima T18b1 prepara adapters REST Auth/metadados com origens fixas e testes de rede simulada; T18b2 valida runtime/deploy desligado. T18c/fornecedor/OF/gates continuam pendentes.

## T18b1 — Portas REST

`supabase-rest.ts` materializa Auth getUser, RPC orbe_is_owner e select explícito de orbe_connections, com origem Supabase e chave pública restritas. O token é recebido novamente na porta de metadata a partir do Bearer da requisição atual; não existe lastToken/cache/estado de sessão compartilhado. RLS é exercida como usuário, sem service role. Claims são apenas precheck estrutural/expiração; confiança depende de Auth remoto, user.id correspondente e RPC booleana. API pública da factory é interna ao backend.

Transport exige redirect error/credentials omit/no-store. URLs são constantes por enum de endpoints; IDs/JWT não entram em query. JSON/UTF8 upstream limitado128KiB, signal e expiração rechecados entre etapas.17 testes novos simulam rede, inclusive Auth recusando token com claims válidas, RPC false, owner divergente, duas sessões concorrentes, abort, limite e erros. Total272 testes/TypeScript cliente+ponte passaram. Nenhum usuário real consultado nesta task, nem runtime Deno/deploy validado.

Base documental e distinção entre garantia externa e decisão própria em [plano T18b1](../../plan/T18b1-REST-PORTS.md). T18b2 abaixo valida somente runtime desligado; T33a guia desconectado também foi concluída.

## T18b2 — Runtime gerenciado, permanentemente desligado

Função `orbe-bridge` publicada no projeto próprio Orbe, versão1, ACTIVE. Entrypoint index.mjs chama Deno.serve com enabled:false literal. Nenhuma variável habilita acesso, e nenhuma configuração/credencial/env/Auth/DB/Pluggy é lida pelo entrypoint. verify_jwt=false deixa o kill switch503 observável sem sessão; não existe endpoint financeiro público. Habilitação futura exige nova revisão/entrypoint com autenticação e gates, nunca apenas mudar configuração remota.

CLI2.121.0 via API, sem Docker/link/prune/secretset. Helper confirma Orbe, fontes conhecidas sem dados privados, entrypoint exato desligado e ausência de função alheia; manifest de versão/hash impede overwrite desconhecido. PAT somente no env administrativo do filho, saída em ~/.config/orbe-finance/bridge-deploy.log (0600), manifest bridge-deploy.json privado. Nenhum log bruto é publicado.

279 testes locais (6 guardas deploy +1hostmock novos) e typecheck cliente/ponte passaram. O mock do host não é Deno; HTTP real no runtime gerenciado confirmou503/exato erro genérico/no-store em três casos anônimos POST{}, GET e query inventada. Deno local continua ausente. Isso valida somente execução desligada; não autenticação end-to-end, adapters ativos, ausência de logs do fornecedor ou integração bancária. Nenhum usuário/valor bancário foi consultado.

## T19a — Política pura de estados/capacidades

`src/domain/connections.ts` normaliza somente DTO interno, sem rede ou vínculo direto ao endpoint publicado. Com integrationEnabled/privateDataApproved diferentes de true retorna desligado sem ler metadata/clock. Quando explicitamente aprovado por fixture, valida ID/revisão/enums/timestamps/clock; active sem OF comprovado não lê, expiração conhecida vira renewal_required, paused/revoked/pending/error bloqueiam. Produto true é elegível; false e null permanecem distintos e ambos não são consultados. Datas futuras inesperadas são rejeitadas; prazo bancário ausente permanece null; prazo do proxy passa a ser obrigatório pela T19b1 abaixo.

Este modelo não verifica identidade/titularidade nem substitui Auth/RLS da ponte. Flags são política interna confiável, nunca parâmetros HTTP. Fonte e autorização bancária precisam de revalidação no adapter futuro. Campos privados/extras não são projetados e propriedades herdadas não dão capacidade.332 testes passaram,12novos de gates/estado/capacidade/expiração/projeção. Nenhum import da UI ou adapter ativo foi acrescentado; domínio puro não altera a função desligada.

## T20a — Controle de leituras no banco

Migration20261019210000_read_leases.sql aplicada, quarta no histórico imutável. connection_reads é privada, uma linha por conexão, RLS sem policy e ACL negada inclusive para acesso direto de service_role. Somente RPCs definer begin/check/finish recebem EXECUTE de service_role; proprietário e anon não executam nem leem/escrevem a tabela. Não há valores/cursors/payloads; exclusão de conexão apaga lease por cascade.

Acquire trava conexão e impõe120s de lease/900s de cooldown por relógio do servidor. Paginação revalida dono registrado, owner da linha, revisão, estadoactive/OF/expiração, nonce/produto true, sem novoacquire. Fim libera busy e mantém cooldown; só success atualiza last_read_at. Alterações de estado/capacidade/evidência/autorização incrementam revisão automaticamente, invalida resultado antigo e não permite downgrade.

335 testes locais passaram, com3guardas adicionais do runner. SQL real rollback passou para papéis service_role/authenticated/anon, acquire/busy/cooldown, páginas, TTL, revisão, capacidades/expiração/owner, finish e cascade. Owner real preservado e zero identidades fictícias residuais. Regressões test-owner/test-metadata passaram após aplicação. São testes sequenciais, não ensaio multissessão; concorrência depende do lock transacional PostgreSQL descrito no plano. Sem chamada bancária/cron/adapter ativo; função publicada permanece literalmentefalse. T20b ligará portas/coordenação com fixtures antes de dados reais.

## T20b1 — Portas privadas de lease (somente fixtures)

`_shared/lease-rest.ts` tem factory lazy: sem enabled/privateDataApproved explícitos não resolve configuração, relógio, transporte ou contexto. Aceita somente origem Supabase restrita e sb_secret moderno em apikey, sem Authorization, cookie ou dado emURL; não lê env por conta própria e não deve ser importado pelo Expo. Auth/proprietário já precisam ter sido verificados antes; SQL também impõe registro/owner/revisão. Nenhuma chave real foi buscada ou gravada nessa task.

POSTs fixos begin/check/finish transportam somente contexto/nonce/produto/outcome canônicos. JSON/UTF8 de resposta limitado16KiB, schemas projetados, grant precisa corresponder revisão/TTL/política120/900; erros brutos nunca retornam. Prazo20s/abort limpa recursos e libera caller mesmo se transporte ignorar signal. Config/contexto são copiados, sem sessão global entre requisições.

Leitor JSON bounded compartilhado extraído de supabase-rest para http-json.ts mantém limite128KiB de Auth; configuração de origem/chave pública agora exige strings primitivas.353 testes e typecheck cliente/ponte passaram (17lease+1config novos). Allowlist de upload agora inclui5fontes conhecidas; não houve redeploy, HTTP real com secret ou ativação do adapter. Função publicada continua v1 desligada, manifest remoto ainda corresponde àquele deploy. T20b2 coordenação/paginação/descartar parcial é próxima.

## T19b1 — Prazos distintos, sem tratar expiração como zero

Migration20261019220000_split_consents aplicada como quinta, com guard de connections vazia; não reinterpretou registros existentes. Coluna genérica renomeada proxy_consent_expires_at, bank_consent_expires_at separada. Helpers de elegibilidade/revisão usam os dois prazos: proxy desconhecido/vencido ou banco sabidamente vencido negam lease; alterar qualquer um invalida revisão anterior. Prazos não são estimados.

DTO da ponte expõe os dois campos explícitos; authorizationExpiresAt é apenas derivação do menor prazo conhecido, ordenando instantes e não strings. Normalizador não confia nesse alias de entrada e não concede acesso por ele. Metadata deve ser revalidada antes de qualquer coleção; vínculo renovado exige verificação administrativa própria. Contexto e fonte externa em [T19b1](../../plan/T19b1-SEPARATE-CONSENTS.md).

359 testes cliente/ponte passaram (6novos), e SQL de leases/metadados/proprietário passou após migration com rollback, zero fakes/owner preservado. Função publicada continua v1 false, sem redeploy/fornecedor/chave real. Nenhuma alegação de OpenFinance real, cobertura de banco ou segurança do runtime foi aprovada com isso.

## T20b2 — coordenação local de lotes

`src/features/sync/read-batch.ts` coordena um lease por conexão e páginas sequenciais somente de produtos legíveis; portas desligadas não são tocadas. Deadline20s por request e TTL do lote, sessão e consentimentos são rechecados antes/depois de awaits e no commit. Recibos inválidos, ciclos, excesso de linhas, cancelamento ou resposta tardia não promovem conteúdo. `stage` é callback local confiável futuro dos normalizadores, nunca função recebida via HTTP. Cache anterior permanece quando lote falha; staging é descartado. MemoryAssets/Ledger aceitam guard síncrono antes da troca, com revalidação do ticket. Não há transação global entre produtos. 381 testes e export iOS; nenhuma chamada bancária, nenhum endpoint financeiro ativo.

T21a: `normalizeAccountPage` aceita apenas DTO interno mínimo com contexto/vínculos previamente confiáveis, gates desligados por padrão. Não comprova Auth/OF nem traduz payload Pluggy. IDs internos namespaceados por conexão; moeda/centavos/data/relação explícitos, ausência não vira zero e extras não são projetados.396 testes, sem endpoint ou promoção automática. Contrato completo em plan/T21a-CANONICAL-ACCOUNTS.md.

T21b: stager de contas por execução liga DTO interno ao coordenador somente em fixtures, sem fonte HTTP. Contexto/vínculos copiados, callback de uso único e recibo local; contagem anterior ao dedupe, cursor/lease/revisão estáveis e limites entre páginas. Promoção única depois da página final e do guard no commit. Fonte mista/parcial impede remover ausentes; clear invalida trabalhos tardios sem apagar cache válido.412 testes/typechecks; T21c fornecedor ainda pendente.

T22a: DTO mínimo de movimentos por conta/mês, IDs internos e fonte namespaceada pela conexão; campo legado externalId contém movementId interno nesta fronteira. Catálogo de categorias e comprovação de transferência vêm de contexto confiável, sem heurística por Pix. Página final não prova janela completa; pending/cancelled e estorno/ref preservados. Texto só dado local limitado, sem execução.432 testes; nenhuma fonte HTTP. Promoção multi-conta será T22b1 antes de staging de produto.
