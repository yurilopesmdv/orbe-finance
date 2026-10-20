# SPEC-009 — Integração automática Meu Pluggy

Estado: ready para R1 sintética; dados reais continuam bloqueados, revisão 0.4 de 16/10/2026. O usuário escolheu Meu Pluggy, condicionado à pesquisa pública de segurança. [Resultado da pesquisa](../../docs/security/MEU-PLUGGY-REVIEW.md): seguir no planejamento; produção depende de evidências próprias. Esta spec prevalece sobre a opção local sem agregador da revisão 0.3. A origem financeira é exclusivamente Open Finance.

| ID | Requisito |
|---|---|
| MPG-01 | DEVE usar exclusivamente Open Finance na conexão original do banco via Meu Pluggy, sem fallback por senha bancária, e priorizar sincronização automática Meu Pluggy para Bradesco e Mercado Pago PF; confirmar termos/cotas gratuitos pessoais antes de implementar, sem prometer gratuidade permanente ou de infraestrutura |
| MPG-02 | DEVE manter credenciais privilegiadas exclusivamente na ponte autenticada, sem incluir segredo no cliente; toda leitura/status/sincronização valida proprietário e vínculo do item/conta no servidor |
| MPG-03 | DEVE distinguir sessão da ponte e desbloqueio local; Face ID/desbloqueio do iPhone não substituem autorização HTTP, nem clientUserId enviado pelo cliente comprova propriedade |
| MPG-04 | DEVE respeitar as capacidades do proxy pessoal, manter lista autorizada de itens e mostrar data/parcialidade; não simular tempo real nem chamar refresh/listagem não disponíveis no plano |
| MPG-05 | DEVE homologar separadamente saldo, movimentos, investimentos e cofrinhos de cada banco; ausência não vira zero nem promessa de cobertura, com prevenção de dupla contagem |
| MPG-06 | DEVE bloquear dados reais até validar acesso, segredos, rede/logs, dependências e revogação/exclusão; pesquisa pública e criptografia declarada não certificam risco zero |
| MPG-07 | DEVE restringir destinatários ao banco, Pluggy e ponte aprovados para a sincronização, além do aparelho; nenhum envio financeiro a ferramentas de desenvolvimento, IA, analytics ou relatório externo |
| MPG-08 | DEVE preservar o último lote válido diante de indisponibilidade e distinguir revogação bancária, desvínculo no Orbe, apagamento local e solicitação de exclusão no fornecedor |

## Aceite futuro

- Sem sessão, com sessão expirada, identidade indevida ou item/conta sem vínculo, nenhuma rota financeira ou de status revela dados ou metadados privados; testar antes de consultar fornecedor.
- App distribuído, logs e erros sintéticos não contêm segredos; requisição alterada pelo cliente não amplia autorização.
- Fixtures de proxy sem listagem global/refresh, atualização diária, erro parcial e ausência de produto mantêm interface honesta e idempotência.
- Cofrinho MP não retornado e movimentos Bradesco indisponíveis aparecem como parcialidade datada, sem apagar valores válidos anteriores nem inventar zeros.
- Revogar impede nova coleta e evento atrasado não recria conexão apagada. Exclusão de backup do fornecedor só é afirmada com confirmação de alcance/retencão.

Senha/sessão continuam no escopo. Expo Go permanece ambiente sintético enquanto limitações de biometria/armazenamento do runtime real não forem resolvidas. Implementação sintética autorizada, uma task por vez; consentimento bancário permanece após gate.

## Contrato de arquitetura T74

A ponte é de leitura sob sessão e não persiste saldos, movimentos, posições ou relatórios. Atualização automática bancária ocorre no fornecedor mesmo com app fechado; o Orbe recebe e promove novos lotes ao abrir/retomar desbloqueado ou solicitar busca. Não prometer sincronização do cache local com o app fechado. Credenciais, vínculos e limites ficam no servidor, relatórios/categorias/metas no aparelho. [Contrato T74](../../plan/T74-BRIDGE-CONTRACT.md).

T13 materializa apenas metadados mínimos e vínculos sob RLS; ids externos privados, sem valores financeiros. Permissão de leitura de metadata exige proprietário global e dono da linha, não só sessão válida. Estado active exige evidência de Open Finance; nenhum item real será provisionado antes dos gates.

## MPG-09 — Núcleo da ponte em fatia sintética (T18a)

A ponte desligada DEVE responder indisponível sem consultar autenticação, metadados, fornecedor, corpo ou temporizador. Quando habilitada exclusivamente por fixture local, núcleo HTTP suporta apenas POST /connections/status com corpo JSON objeto vazio e limite16KiB. Token só no cabeçalho Bearer; não aceitar parâmetros de URL nem origem/owner/item informados pelo cliente. Port de autenticação deve retornar identidade verificada, autorização de proprietário e expiração; núcleo nega sessão ausente/expirada e segunda identidade antes de metadados. Cada resultado exige mesmo owner e schema/projeção explícita; IDs externos/PII/extras não retornam. Prazo total20s/cancelamento impede promoção tardia e início de próxima etapa; portas devem respeitar signal. Respostas no-store, sem CORS genérico, logs ou erro bruto. T18a não comprova JWT real, RLS em HTTP, Deno/deploy ou integração Pluggy; T18b validará adapters/runtime antes de publicar endpoint.

## MPG-10 — Portas REST isoladas por requisição (T18b1)

Autenticação DEVE consultar o servidor Auth do projeto fixo e a RPC de proprietário com o mesmo Bearer. Decodificar claims localmente não comprova assinatura; só usar identidade após resposta autenticada e correspondência de subject/issuer/aud/role/expiração. Porta de metadados recebe explicitamente o mesmo token validado da requisição, sem estado global/cache de sessão; RLS continua sob o JWT do usuário, sem service role. URLs/select/order/limit são constantes, sem IDs pessoais em query. Recusar redirects, cookies, resposta excessiva ou inválida; nenhuma resposta de erro bruta é publicada. Duas requisições concorrentes não podem trocar sessão. Habilitar adapter somente em testes locais nesta fatia, sem deploy ou fornecedor.

## MPG-11 — Validação de runtime desligado (T18b2)

Uma função de desenvolvimento PODERÁ ser publicada somente no projeto próprio Orbe com gate literal false, sem consultar env, Auth, DB ou provedor. Endpoint público sem sessão serve exclusivamente resposta503 genérica/no-store, independentemente de rota/corpo/token; não é rota financeira pública. Alterar esse gate exige task/gates próprios. Deploy não deve receber arquivos privados ou ler infraestrutura alheia; recusar função existente sem manifest local correspondente e não apagar funções. Validar runtime por HTTP sintético sem token real; não declarar adapters/fluxos reais homologados a partir de503.

## MPG-12 — Runtime separado de metadados (T18b3)

Status autenticado DEVE usar composição separada da ingestão financeira. Somente POST /connections/status e contrato MPG-09/10; nunca importar fornecedor, leases ou chave privilegiada. Configuração é capturada no boot: habilitação somente pela string literal `true`, origem HTTPS fixa Supabase e chave `sb_publishable_`. Desligado não lê origem/chave, request ou transporte. Configuração ausente/inválida/falha de leitura resulta503/no-store sem detalhes, sem rede e sem derrubar o handler. Não aceitar configuração de request ou habilitação financeira implícita. Sessão deve passar Auth remoto e orbe_has_session antes de RLS.

T18b3a cobre factory e testes locais, sem novo entrypoint publicado. T18b3b revisará empacotamento, configuração operacional, manifest e deploy separado; orbe-bridge publicado permanece literalfalse. HTTP positivo do proprietário e comportamento nativo permanecem na validação física final.

### MPG-12a — Entry point de status separado

T18b3b1 prepara somente orbe-metadata/index.mjs: delegar runtime MPG-12 com leitor Deno.env restrito aos três nomes previstos e fetch do host. Não ler configuração no corpo do request, nem importar módulo financeiro/serviço privilegiado. Ausência da flag mantém503 sem acessar origem/chave/rede. Hostmock deve provar esse comportamento e negação sem Bearer quando habilitado. Não adicionar configuração de deploy ativo nesta fatia; helper desligado verifica conteúdo exato dos dois entrypoints e recusa alteração indevida.

### MPG-12b — Caminho do runtime gerenciado

A composição metadata-only DEVE aceitar exclusivamente `/orbe-metadata/connections/status`, considerando prefixo de função documentado pelo Supabase. O core isolado mantém `/connections/status` por padrão; opção interna de composição permite somente esses dois caminhos literais, capturada no boot e nunca derivada do request. Prefixos de gateway, outra função, caminho sem prefixo no runtime metadata, queries e sufixos são recusados antes de autenticação/rede. Nenhum rewrite de Request/body/signal. T18b3b2a valida sinteticamente; HTTP real permanece T18b3b2b.

### MPG-12c — Publicação controlada de status

T18b3b2b DEVE confirmar projeto próprio saudável, artefatos permitidos, configuração pública da mesma origem do app e identidade/versão de função previamente gerenciada antes de mutar. Publicar somente orbe-metadata com manifest/log0600 fora Metro, sem tocar orbe-bridge ou prunes. Habilitação exclusiva ORBE_METADATA_ENABLED e ORBE_PUBLISHABLE_KEY; nunca service role, credencial bancária ou ingestão financeira. Configurar false antes de deploy inicial, verificar ACTIVE e gateway sem verificação legacy (Auth remoto+RPC no código), habilitar true e redeploy para capturar boot; não prometer revogação instantânea via env de instância quente.

Teste HTTP anônimo e token inventado só pode revelar erros genéricos/no-store; rota/método/query indevidos não chegam a conteúdo. Confirmar endpoint financeiro antigo ainda503. Erro operacional não imprime resposta/log/config brutos; tentativa de desabilitar flag em falha é best effort, sem alegar desligamento confirmado sem smoke/redeploy. Login positivo do titular continua manual, sem credencial nas ferramentas. Nenhuma nova conta/banco/consentimento nesta tarefa.

## MPG-13 — Autenticação do fornecedor isolada (T51b1)

Preparar módulo exclusivamente server-side, sem SDK/rota pública/entrypoint ativo. Factory fica desligada por padrão e, nesta fatia, só aceita ativação explícita para fixtures com transporte injetado; desligada não consulta configuração/transporte/relógio. Autenticação usa exclusivamente POST https://api.pluggy.ai/auth, clientId/clientSecret no corpo JSON, sem credencial em URL e sem aceitar origem/path do chamador. Configuração primitiva é capturada uma vez; destinos, cookies, redirects e cache são restritos. Nenhuma integração financeira real habilitada.

Resposta JSON de autenticação limitada a4KiB, esquema/apiKey explícitos; erro/redirect/corpo inválido não gera log nem saída bruta. Timeout total20s e cancelamento abrangem rede/leitura, inclusive transportes que ignoram signal. Falha não inicia retry. Apenas uma emissão em curso por instância; concorrente recebe busy. Chave fica privada em memória, nunca é retornada ao chamador nem exposta no cliente/status; reutilizar prontidão até119min (margem conservadora ante2h documentadas), expirar/descartar no timer, close e erro de relógio. Resultado tardio não restaura chave após cancelamento/close. Reabrir instância encerrada é proibido; rotação futura cria nova instância.

ready significa somente credencial técnica obtida em fixture; não prova proprietário, vínculo bancário, Open Finance ou aprovação para dados reais. Não adicionar ainda leitura de produtos: seus IDs em URL exigem decisão SEC-05 e revisão de logs/retencão. T51b/T18c continuam incompletas por esta fatia.

## MPG-14 — Números upstream preservados antes da projeção (T51b2b1)

JSON financeiro não pode passar por Number/toFixed antes da conversão exata. Decoder server-side preserva o token numérico original por JSON.parse reviver context.source, com prova de capacidade no boot/factory; ausência resulta em indisponível antes de coleta, sem fallback lossy. Não assumir suporte do Deno a partir do teste Node. Decoder não é importado pelo status/cliente/entrypoint financeirooff.

Leitura HTTP continua limitada128KiB/UTF8estrito/cancelamento; decoder recebe texto apenas depois desses limites e recusa profundidade>64 ou literal numérico>128chars. Números são células opacas com marca de procedência local; um Number já convertido, string com números ou objeto falsificado não é número exato válido. null/bool/texto permanecem dados, sem executar URLs/instruções. Acessor de contador só produz Number para inteiro não negativo comprovado e dentro de limites explícitos. Valores financeiros seguem por decimal original para futura conversão BigInt; expoente/escala/moeda e domínio são responsabilidade da projeção seguinte.

Erro nunca expõe texto/campo/payload nem promove cache. Nesta fatia só parser/porta HTTP e fixtures, sem DTO financeiro novo/rede/deploy. T51b2b/T18c não se concluem com o decoder.

## MPG-15 — Projeção mínima de contas do fornecedor (T51b2b2)

Transformar página do fornecedor em DTO interno de contas somente sob gate explícito de fixture. Desligado não consulta raw/context. Contexto server-side previamente autorizado fornece item/conexão, mapa de IDs externos→internos e evidências de relação/data. Validação sintática do contexto não autentica owner/sessão/lease nem provisiona vínculos.

Conferir item de cada linha e vínculo conhecido; nunca devolver ID externo, número bancário, CPF, titular, nome livre, logo ou campos extra do provedor. Emitir somente ID interno/conexão/moeda/centavos ou null/data e relação comprovadas. BANK vira conta; CREDIT fica excluído com contagem de cobertura explícita, não é ativo positivo nem some silenciosamente da avaliação do escopo. Subtipo/nome de marketing não comprovam cofrinho.

Converter major→centavos por coeficiente decimal original/BigInt, sem arredondar: escala fracionária excedente só admite zeros exatos e expoente limitado; overflow fora do intervalo safeinteger do DTO atual invalida lote. Moedas de duas casas homologadas nesta projeção BRL/USD/EUR; outra moeda permanece com valor null/currency preservada e cobertura parcial, sem inventar BRL/câmbio. Datas/relacionamento nunca vêm de relógio/marketing: contexto pode manter null/unknown. updatedAt do registro não é automaticamente valuation date.

Página de contas só é completa com page1 e totalPages<=1, total=linhas recebidas e sem duplicata; outra paginação não suportada falha fechada, sem fabricar cursor. Campos contadores vêm do decoder exato. Contexto explícito de cobertura, fonte/datagem/relação e ausência de exclusões/valores desconhecidos determinam authoritative; simples status UPDATED/arrayvazio não autorizam apagar cache. Caller futuro ainda revalida consentimentos/lease antes de buscar e promover. T51b2b/T18c continuam pendentes de transporte/autorização/composição.

## MPG-16 — Transporte restrito de contas (T51b2c1)

Preparar porta server-only de leitura de contas em fixtures, preservando a API pública anterior de autenticação. Chave técnica permanece na mesma closure e nunca é retornada. Conta usa exclusivamente GET /accounts?itemId no host literal e X-API-KEY, sem body/cookies/redirect/cache/Referer. Provar decoder exato antes de autenticar/coletar; sem suporte não consultar rede. Capturar contexto de projeção validado antes do primeiro await, sem aceitar URL do chamador. Esta porta não prova owner/sessão/lease; composição autenticada posterior é obrigatória antes de expor HTTP.

Uma leitura por instância, prazo total20s incluindo autenticação e corpo, cancelamento/close mesmo se transporte ignorar signal. Resultado tardio ou chave expirada não entrega dados. Sem retries implícitos; 401/403 invalidam chave,429 vira código rate_limited. Resposta JSON128KiB/UTF8estrito/decoder exato e projeção mínima antes de saída; erro genérico sem payload. Sem imports em cliente/entrypoints, credenciais ou chamadas reais nesta tarefa. Default disabled zero inputs. Factory de auth antiga continua somente authenticate/close.

## MPG-17 — Leitura autenticada de contas sob lease (T51b2c2)

Handler isolado, desligado por padrão e ativável somente em fixtures, POST /accounts/read, corpo16KiB estrito connectionId/revision/leaseId/cursor:null. Nunca aceitar owner/item/ID externo ou URL do app. Verificar Auth remoto/sessão/password/owner pela porta existente antes de resolver vínculos; resolução recebe subject validado e conexão/revisão internas. Conferir owner/conexão/revisão retornados e capturar contexto da projeção antes de consultar provedor. Check de lease para accounts obrigatório imediatamente antes e depois da coleta. Reautenticar sessão após coleta e conferir mesma identidade/validade; cancelamento, expiração, pausa/revisão ou revogação descartam resposta. O lease é adquirido/finalizado pelo lote, não criado silenciosamente pelo handler.

Prazo total20s cobrindo todas as portas mesmo se ignorarem signal, abort propagado e nenhuma resposta financeira tardia; sem retry. Saída whitelist DTO mínimo/no-store, nunca erro bruto ou IDs externos. Ports são componentes internos confiáveis, não executáveis fornecidos pelo cliente; resolver financeiro service-only segue fatia posterior. Nenhum entrypoint ativo, conexão real ou gate de privacidade alterado.

## MPG-18 — Resolver privado de vínculos de contas (T51b2c3)

RPC service_role-only resolve owner/conexão/revisão/lease validados; negar cliente anon/authenticated, owner não cadastrado, conexão pausada/removida, revisão alterada, lease inválido/expirado e produto indisponível. Consultar bindings privados somente após checkaccounts sob lock da conexão. Retornar IDs técnicos apenas ao servidor, nunca ao app/log. Sem escrita/provisionamento automático: vínculo ausente/ambíguo falha; quantidade<=1000. Contexto não infere valuationDate/distinção/coverage a partir de updatedAt ou tipo: null/unknown/false enquanto sem evidência. Nova migration imutável, testes SQL com identidades fictícias/rollback e verificação de proprietário preservado.

Porta REST restrita a POST RPC literal do projeto próprio, segredo backend no header e IDs no body; gates enabled+fixtureOnly e transporte injetado, offzeroinput. Nenhum acesso genérico a tabela privada, URL do chamador ou fallback. Integração com handler passa leaseId ao resolver e preserva checagens antes/depois; entrypoint financeiro continua inativo.

## MPG-19 — Ciclo HTTP do lote de contas (T51b2c4)

Endpoints fixture-only POST /reads/acquire e /reads/finalize, desligados por padrão. Body fechado com connectionId/revision; finalize adiciona leaseId/outcome success|failed|cancelled, sem owner externo. Authowner/sessão remota antes de chamar RPC; scopeowner vem da identidade validada e parâmetros capturados. Nova verificação Auth antes de devolver sucesso; expiração/cancelamento invalida resposta. Acquire retorna somente status/lease/revisão/datas validados, busy/cooldown explícitos; finalize exige confirmação true e retorna status complete, nunca booleano ambíguo. Sem resolver/provedor/valores financeiros nessas rotas.

As garantias120s/900s/revisão/consentimento continuam SQL e portas existentes. Deadline20s, body16KiB, no-store, sem query/URLs/PII, sem retries nem vazamento de erros. Se cancelar depois do acquire, lease pode ficar até TTL; não iniciar cleanup não autorizado/sem limite, não afirmar liberação remota. Composição router prepara acquire/read/finalize com gates fixtures e não altera entrypoint publicado. Testes simulados de lote completo e rejeições antes/depois; appgateway seguinte consome esse contrato.

## MPG-20 — Gateway client de contas e cache volátil (T51b2c5)

ProductTransport restrito a contas, gates enabled+privateDataApproved, off não lê sessão/config/contexto/transporte. Sessão.read fornece token e cancelamento, exigir origem pública exatamente igual à sessão e host Supabase próprio. Só POST destinos literais orbe-bridge/reads/acquire, accounts/read, reads/finalize, corpo com IDs internos; nunca Pluggy ou segredo técnico no app. Sem token em query/log/erro. Snapshot contexto de IDs internos autorizados previamente recebido; contexto local usa UUID aleatório de cache e não subjectAuth. Gateway não provisiona vínculos nem aceita conta retornada sem registry.

Response bounded128KiB/UTF8/JSON, sem redirect/cache/cookies, timeout20s/cancelamento mesmo se fetch ignorar signal. 401/403 invalidam sessão pelo mecanismo existente;429 explícito, sem retry. Página exige mesma conexão/revisão/lease/produto e contagem, normaliza contas/IDs/moeda/centavos/datas antes do staging. Cache anterior só substituído depois do finalize confirmado e guard de sessão. Nenhuma persistência financeira/AsyncStorage/Keychain; tela protegida e readiness de coleta entram na composição, não são inferidos desta porta. Testar integração RouterHTTP→gateway→runProductBatch/SyncSession com dados inventados e purge ao bloquear. Nenhum flag real habilitado.

## MPG-21 — Registry autenticado de IDs internos (T51b2c6)

Preparar leitor de metadados de contas sob sessão.read/RLS já existentes. GET literal /rest/v1/orbe_accounts?select=id,connection_id&order=id.asc&limit=1001 no próprio projeto; sem filtros que incluam owner/conta em URL, saldo/PII/ID de provedor ou servicekey. RLS activepasswordsession+owner decide linhas permitidas. Validar UUIDs próprios, duplicatas e limite1000; overflowfalhafechada em vez de truncar lista. Selecionar conexão interna em memória e retornar somente IDs opacos dela, nunca inferir pertencimento pelo nome/banco.

Defaultoff não consulta sessão/config/input. Sameorigin/401lock/cancel/deadline/boundedJSON/no-store/redirect/no-retry compartilham transporte do gateway de contas, com operações literais fechadas. Metadata reader não aprova dados reais nem provisiona vínculo. Seu resultado será o allowedAccountIds do contexto local; criação de cache exige novo UUIDlocal independente de Auth. Integração fixture registry→gateway rejeita conta ausente; cliente não pede nem recebe IDs externos. Não publicar novo QR enquanto nada dessa composição entra no runtime.

## MPG-22 — Escopo explícito de produtos do lote (T51b2c7a)

Lote aceita seleção opcional de produtos; ausência preserva todos os disponíveis. Seleção explícita não vazia/sem duplicata/enum precisa ser subconjunto das capacidades legíveis atuais. Capturar antes do primeiro await; ordenar pela ordem canônica. Não adulterar capabilities nem fingir que produto não solicitado está indisponível. Consultar/normalizar/promover somente produtos selecionados e marcar resultado global parcial quando houver produtos legíveis não solicitados. Contextos dos demais produtos não são necessários nem acessados; nenhum cache de produto não solicitado é apagado. Seleção inválida falha antes de acquire, gatesoff sem tocar opção/input. Encaminhar seleção por SyncSession e ProductBatch até ReadBatch.

## MPG-23 — Controlador de contas condicionado à privacidade (T51b2c7b)

Compor status autenticado→registry→gateway→SyncSession somente com sessão desbloqueada e ScreenProtection ready+active; gates enabled+privateDataApproved off não consultam dependências. Scopefactory gera novo UUIDlocal por instância, independente de identidade Auth. Revalidar sessão/proteção antes/depois de cada await e antes da query; assinar mudanças para cancelar e purgar imediatamente ao perder readiness/atividade/sessão. Instância encerrada não reabre; retorno ao app cria outra sem valores anteriores.

Uma atualização por vez, deadline global120s além dos20s de cada request, cancelamento mesmo se uma porta ignorar signal. Não emitir snapshot/resultado tardio após close. Status deve provar accountslegível/capacidade/consentimentos antes de registry/coleta; produto restrito explicitamente a accounts. Contexto vem de metadata+registry+scopeUUIDlocal, não de IDs externos/inferência do saldo. Snapshot só fase/aviso; dados consultados sob guard do cache, sem persistência, logs ou telemetria. Falhas preservam snapshot válido enquanto mesma sessão/proteção; readonlyquery protegida, nenhuma aprovação bancária real inferida de fixtures.

## MPG-24 — Composição de contas no app, ativação independente (T51b2c8)

Preparar tela Minhas contas protegida pelo Screen/privateguard, mesma identidade visual, valores ocultos por padrão e toggle existente. Apenas instituições/ID local resumido/moeda/saldo/data/relação e aviso explícito de cobertura parcial; não introduzir nome de titular/conta/URLs. Sem conexão não inventar saldozero. ScopeUUID usa ExpoCrypto randomUUID57.0.4 incluído no Go, sem fallback Math.random/AuthUUID. UUID só gerado depois de sessão+proteção+gates.

Composição exige separadamente accountReadsEnabled, liveIntegrationEnabled e privateFinancialDataApproved. Todosfalse nesta entrega; defaultoff não cria statusreader/registry/gateway/cache nem UUID/rede. UI off apenas informa preparação e permite voltar/conexões; não apresenta botão enganoso de conectar banco nem sugere que login já autoriza OpenFinance. Somente composição autorizada instancia controller, fecha em blur/unmount/perda de readiness. Nada de valores em URL/params/navegação. Na futura ativação, lista metadata e escolha por conexão é interna, refresh explícito, sem polling/cron. Contratos de fornecedor/proxy/OpenFinance/Edge/dependências continuam gates separados.
