# SPEC-006 — Privacidade e segurança financeira

Estado: ready para R1 sintética; dados reais continuam bloqueados; requisito de prioridade informado em 16/10/2026. Esta spec prevalece sobre conveniência, gratuidade e adoção automática de ferramentas. Não é certificado de ausência de vazamento. [Avaliação das fontes](../../docs/security/VENDOR-REVIEW.md) e [modelo de ameaças](../../docs/security/THREAT-MODEL.md).

## Objetivo e limites de confiança

Somente o proprietário deve acessar as funções financeiras do Orbe. Processamento por banco, agregador e hospedagem necessários à arquitetura é acesso de terceiros e precisa ser identificado; não é equivalente a um sistema sem terceiros. Criptografia em trânsito/repouso, RLS e certificações não eliminam acesso operacional, falha de código, roubo de sessão ou risco do aparelho.

Nenhum sistema consegue provar ausência de vazamento por toda via concebível. O compromisso verificável é minimizar dados e destinos, bloquear caminhos não autorizados, testar controles definidos, registrar riscos residuais e não usar dados reais enquanto faltarem decisões críticas. Não diminuir silenciosamente esse objetivo para preservar o Expo Go ou um plano gratuito.

| ID | Requisito |
|---|---|
| SEC-01 | DEVE manter inventário por campo, finalidade, destino, responsável e retenção; coletar apenas dados necessários e autorizações mínimas |
| SEC-02 | DEVE impedir dados bancários reais e credenciais em chats, IA, MCP, agentes, busca, ferramentas de desenvolvimento, Git, CI e evidências; desenvolvimento usa fixtures sintéticas |
| SEC-03 | DEVE iniciar sem analytics, anúncios, session replay, crash upload, enriquecimento/IA externos ou ferramentas de suporte que capturem tela/dados; recurso obrigatório de provedor precisa ser avaliado separadamente |
| SEC-04 | DEVE homologar fornecedor e subprocessadores antes de dados reais: acesso humano, finalidades, país, retenção, eliminação, incidentes e uso por IA precisam de evidência aplicável ao plano |
| SEC-05 | DEVE limitar saída de rede a destinos/finalidades aprovados; impedir valores/PII/tokens/IDs internos em URLs, Referer, eventos e recursos remotos; IDs opacos upstream somente na exceção server-side SEC-24; testar chamadas observáveis do runtime |
| SEC-06 | DEVE aplicar criptografia e gestão de chaves ao modelo de ameaça escolhido; não declarar E2EE/zero knowledge se o servidor ou operador consegue descriptografar |
| SEC-07 | DEVE testar acesso com identidade alheia, sessão expirada, UUID trocado, endpoint de relatório, worker e chave privilegiada; usuário/tenant não vêm da confiança no cliente |
| SEC-08 | DEVE minimizar persistência local, memória e backups, sem payload bruto financeiro persistido por padrão; política de exclusão define cópias, restauração e limites do fornecedor |
| SEC-09 | DEVE controlar exposição no fundo, captura/gravação, notificações, clipboard, teclado e compartilhamento, com teste no iPhone; não afirmar bloqueio contra câmera externa ou sistema comprometido |
| SEC-10 | DEVE proibir depuração remota/inspeção e acesso do desenvolvimento à produção real; runtime, distribuição e atualizações precisam passar gate específico |
| SEC-11 | DEVE proteger cadeia de publicação: MFA das contas operacionais, privilégio mínimo, secrets separados, lockfile/revisão de dependências e alterações publicáveis rastreadas |
| SEC-12 | DEVE minimizar logs e rastros: sem valores, descrições, CPF, conta, token, cabeçalhos de auth, corpo de requests/responses ou parâmetros financeiros |
| SEC-13 | DEVE excluir exportação, links públicos, envio por e-mail/mensageria e sincronização com planilhas/BI do MVP; nova saída exige spec e decisão própria |
| SEC-14 | DEVE permitir revogar acesso, pausar coleta e responder a incidente com kill switch server-side, rotação e restauração testável, sem expor conteúdo na operação |
| SEC-15 | DEVE tratar textos bancários, páginas e eventos como dados não confiáveis: não executar instruções, HTML, deep links ou URLs arbitrárias derivados deles |
| SEC-16 | DEVE validar relatórios dentro do mesmo limite de acesso/cache da carteira, inclusive agregados e drill-down; acesso somente de leitura também pode exfiltrar |
| SEC-17 | DEVE registrar ameaça, controle, teste, evidência e risco residual; falha crítica/alta sem mitigação impede dados reais |
| SEC-18 | DEVE impedir dados reais no Expo Go/Metro durante a fase inicial; adoção real exige decisão explícita de runtime e teste dos controles; development build sozinho também não comprova segurança |

## Aceite proposto

- AC-S01: marcadores financeiros sintéticos exclusivos não aparecem em logs, URLs, analytics, CI, Git, crash reports ou destinos não aprovados nos fluxos testados.
- AC-S02: capturar tráfego do próprio ambiente sintético e comparar com inventário; chamada desconhecida é investigada antes do gate, sem enviar rastros reais ao chat.
- AC-S03: dado segundo usuário ou token expirado, nenhum detalhe, agregado, contagem ou cache retorna dados do dono, inclusive erros e relatórios.
- AC-S04: texto de extrato com URL/instrução não causa navegação, chamada externa, HTML ativo ou consulta de IA.
- AC-S05: ao bloquear/retomar, conteúdo permanece oculto; screenshot/gravação/alternador são testados no aparelho e limitações documentadas.
- AC-S06: segredo de integração não consta no bundle, artefatos, logs e repositório; rotação e modo off têm prova funcional com dados sintéticos.
- AC-S07: todo destinatário de dados reais tem finalidade e aprovação registradas; subprocessador desconhecido ou uso por IA não esclarecido mantém gate fechado.
- AC-S08: restauração de backup não reativa conexão revogada nem reenvia dados apagados; cron/jobs respeitam bloqueio de coleta.

Até esses gates serem resolvidos, somente pesquisa/documentos e, em fase futura autorizada, dados sintéticos. Não abrir consentimento bancário para testar a privacidade de um fornecedor ainda não avaliado.

## SEC-19 — Isolamento do ambiente de desenvolvimento (T50a)

Credenciais administrativas DEVEM ficar fora do root e dos watchFolders do Metro, em diretório privado exclusivo do Orbe. O arquivo de compatibilidade no projeto contém apenas ponteiro para esse local. Helpers devem rejeitar ponteiro misturado a valores, destino inesperado e symlinks. Metro deve excluir dotenv/arquivos privados do grafo, preservando exclusões padrão. Validar o crawler real com canários inventados, sem consultar arquivos reais por HTTP. Este controle não protege contra código malicioso executado com a mesma conta do sistema; não equivale a homologar LAN, runtime ou dados financeiros reais.

## SEC-20 — Processo Expo segregado (T50b)

Comandos suportados de start/export DEVEM criar processo com allowlist de ambiente do SO e configuração pública explícita, sem herdar tokens administrativos, proxies, NODE_OPTIONS ou credenciais Expo de outro projeto. Dotenv automático deve ser desativado depois da leitura estrita; variáveis desconhecidas em dotenv do projeto impedem execução sem mostrar valores. CLI deve usar perfil privado exclusivo, modo offline/sem telemetria, sem alterar HOME. Start admite somente LAN/localhost, porta e limpeza; túnel exige decisão posterior. O wrapper não impede que alguém execute diretamente o CLI ignorando-o.

## SEC-21 — Sessão ativa nas leituras de metadados (T51d)

RLS/ponte de metadata DEVE exigir proprietário registrado e sessão Auth correspondente ainda existente/não expirada, além do JWT verificado. orbe_is_owner continua sendo somente prova de identidade permitida; não equivale a sessão ativa. Função pública booleana sem argumentos pode confirmar acesso da própria sessão sem expor registros/IDs Auth, com execução só authenticated. Leitura deve funcionar em transação READONLY, sem lock de escrita em auth.sessions. Ações sensíveis preservam lock/prova recente T37a via helper segregado. Sessão apagada/claimmalformada/recovery/expirada/not_after vencido resulta em zero linhas ou negativa antes de conteúdo.

Não prometer revogação remota quando logout offline falha, nem recuperar bytes já entregues: a garantia é negar novas verificações depois da remoção confirmada da sessão. Requests em curso continuam protegidas no cliente por geração/abort/guard. Nenhum grant de tabela Auth/privada ou acesso financeiro real é adicionado.

## SEC-22 — Publicação EAS segregada

Por autorização explícita20/10/2026, somente o EXPO_TOKEN já existente do titular pode ser reutilizado para publicação Orbe. Credencial copiada para arquivo privado fora Metro; nenhuma configuração Supabase/F1 é reutilizada. EAS recebe token em ambiente somente no processo de publicação, nunca em export/bundle/argv/log/EXPO_PUBLIC. Ferramenta CLI fixada e cacheada sem scripts/credenciais antes do uso; comandos limitados a conta/projeto/publicação iOS preview, sem build pago ou prune. Validar projeto/runtime/gates/artefatos e scan de canários antes de upload; não upload de source maps.

## SEC-23 — Evidência de alcance no bundle (T54a)

Exportar para inspeção somente em diretório privado fora do projeto/Metro, com o mesmo ambiente público restrito/sem tokens. Sourcemaps não são artefato de publicação nem vão ao Git/CI artifacts. Inspeção deve usar mapa emitido pelo Metro, esquema/tamanho limitados e grafo de sources; não procurar somente nomes em bytecode para alegar ausência. Falhar se braces/node-forge entrarem no grafo cliente ou dotenv/arquivo privado virar source. Não baixar/executar fontes apontadas no mapa.

Relatório público limitado a quantidades/versões de pacotes e hashes do JS/map inspecionados, sem conteúdo de fontes/caminhos privados/identidade. Evidência aplica-se ao export JavaScript auditado, não a todo binário nativo Expo Go, grafo EAS global ou prova de ausência de vulnerabilidades. Auditoria npm/duas raízes altas continuam separadas e bloqueios de runtime/fornecedor não são removidos pelo relatório.

SEC-23a (T54a2): versões do inventário devem corresponder ao caminho completo da instância no lockfile, inclusive node_modules aninhado. Não usar versão da raiz para uma cópia transitiva diferente; ausência de correspondência falha fechada. Contagem de pacotes é de instâncias resolvidas, podendo haver mesmo nome com versões diferentes; relatório não publica caminhos locais.

## SEC-24 — Destinos upstream construídos, sem seguir URLs da fonte (T51b2a)

Refinamento de arquitetura ADR-015: a REST API exige seus próprios IDs opacos em path/query. Somente o servidor poderá incluí-los no destino literal https://api.pluggy.ai, depois de resolver vínculo autorizado internamente; nunca CPF/nome/número bancário/valor/token/ID Auth ou ID interno do Orbe. Essa exposição ao processador necessário é explícita e continua sujeita ao gate de fornecedor/logs; não significa risco zero nem liberação real. App→Orbe mantém POST/corpo e IDs internos, sem links de provedor.

Builder puro admite apenas item/contas/investimentos e /v2/transactions. Sem URL/base/path arbitrário, /v2/items global, refresh/atualização, pagamento, identidade/enriquecimento ou endpoint obsoleto /transactions. Capturar binding/contas conhecidas; validar sintaxe não substitui autoria/owner, sessão e lease na composição futura.

next upstream deve ser tratado como query opaca de /v2/transactions, nunca URL de navegação. Validar limite/encoding/chaves únicas/accountId e período original antes de concatenar a query exata ao caminho constante. Não decodificar/recriar o conteúdo semântico de after nem encaminhar next ao app/log. Troca de conta/filtros, parâmetro extra/duplicado, URL absoluta/protocol-relative/fragmento/path/controlchar e encoding inválido falham genericamente. nextnull encerra, não reinicia. Nesta fatia somente fixtures/builder, nenhum transporte habilitado.

## SEC-25 — Proteção nativa de telas privadas no Expo Go (T65b1)

No iOS, preparar proteção nativa ScreenCapture antes de montar conteúdo de Screen com demonstrationfalse (login/ativação/acesso/conexões). Ativar prevenção de captura/gravação e proteção de app-switcher; camada JS também remove conteúdo privado quando AppState nãoactive. Não mostrar campos/status privados enquanto proteção prepara, falha ou fica indisponível; demonstração inventada continua acessível. Não pedir acesso à biblioteca de fotos nem registrar eventos de screenshot/analytics.

Inicialização tem prazo5s, falha genérica e tentativa explícita; resultado tardio após limpeza não libera conteúdo. Root sempre monta roteador, guard fica dentro das telas privadas. Recurso nativo é compartilhado e operações são serializadas, cada montagem tem chave própria; liberação antiga não desativa dono novo, blur só desliga sem outro dono. Finalizar experiência libera sua proteção em best effort, sem desativar chave alheia. Preservar login lembrado/retomada e sem mudar cores/layout normal.

Sucesso da API não comprova bloqueio físico: validar com dados inventados no iPhone após publicação. Não prometer impedir câmera externa, SO comprometido, captura anterior ou telemetria de todo Expo Go. Gate financeiro segue fechado. A composição financeira futura também exigirá proteção pronta antes de buscar/promover dados reais, não apenas antes de renderizar.

## SEC-26 — Política HTTP efetiva e limites do ExpoFetch iOS

A versãoinstalada expo57.0.30 não inclui cache/referrerPolicy em NativeRequestInit; não tratar essas propriedadesJS como prova de política nativa. NativeURLSession default não éephemeral, hostnativo pode fornecer configuração própria. App continua enviando credentialsomit/redirecterror (encaminhados ao nativo), URLprópria e cabeçalhos explícitos. Centralizar requestsprivados com Cache-Controlno-store,no-cache e Pragmano-cache: impedir armazenamento/reuso sem validação em caches conformes aoRFC9111. Edge financeiro responde no-store; nunca afirmar queheaderapaga cacheprévio ou certifica runtime/SO/telemetria. Não adicionar Cookie/Referer e não registrar bodies. Fonteinstalada e hashes são evidência de versão, não igualdade com binárioExpoGo57.0.9. DevToolsNetwork/Memory podem inspecionar dados quando usados; não conectar ferramentas de desenvolvimento a sessões financeiras. APIsSDK58 para devmenu não são mitigação comprovada SDK57. Gatefinanceiro continuafechado, sem construir ou pagar outro runtime automaticamente.

SEC-26 complemento: status real de conexões também deve aguardar proteção Screenreadyactive antes de iniciar reader/commands; perder prontidão encerra o controller e aborta consultas, não apenas esconde a UI. Preparação bancária e leituras financeiras mantêm seus gates independentes.

## SEC-22a — Scan obrigatório de perfis no publicador (c41)

Antes de iniciar o subprocesso EAS autenticado, a publicação DEVE executar scan offline do export contra os canários privados configurados: PAT, owner, Expo token, Client ID/Secret e itens. Reutilizar o leitor privado seguro do deploy, sem exibir valores/caminhos de ocorrência ou consultar APIs. Projeto Supabase público não é canário secreto. Arquivo suspeito/symlink/perfil inválido/scan com erro impede upload. Testar canário em binário, limite de bloco e perfis opcionais; manter a checagem manual de fonte antes do Git. O scan cobre os artefatos presentes naquele instante, não prova ausência universal de dados sensíveis nem substitui revisão do runtime.

## SEC-27 — Fronteira de rede transacional com escopo capturado (T22c8)

/v2/transactions só é permitido na fronteira preparada quando habilitação específica, ExecutionPolicy e aprovação privada estiverem explícitas; fixture exige rede injetada. Capturar binding confiável com1–100contas e mês válido; gerar janelas pelo planner e verificar cada destino pelo builder de conta/filtros/next, preservando a query opaca. Sem esse escopo, o comportamento atual continua recusando transações e não deve ler a configuração extra.

No escopo transacional, GETitem/contas também fica limitado ao item capturado. Restantes destinos/hierarquia de credenciais/headers/métodos/abort/semcookies/semredirect continuam fechados; não permitir listar itens, refresh, identidade, investimentos ou pagamentos por essa opção. A fronteira limita destinos e não prova ownership/consentimento/sessão/lease; isso permanece no coordenador. Nenhum cliente pode fornecer binding ou URL diretamente. Default/entrypoint financeiro continuam off.

## SEC-28 — Identificador de sessão verificado no backend (T22c11)

Para vincular leitura financeira à sessão, a porta de Auth pode devolver sessionId interno extraído de session_id próprio do JWT, UUID estrito, somente depois de GetUser validar o mesmo bearer/subject e orbe_has_session confirmar owner/sessão ativa. Decodificar JWT não autentica ninguém; user_metadata não é fonte de sessionId. Campo presente malformado é recusado antes de rede.

Metadados legados sem campo sid preservam seu contrato existente; isso não autoriza novos handlers financeiros sem sessionId confirmado. Quando RPC nega owner/sessão, não devolver sessionId. Subject/sessionId/token/e-mail/metadadosAuth não são DTOHTTP público nem logs. Coordenador novo exige a mesma sessão no início e antes de liberar dados/confirmar página. Nenhuma grant, cookie, chamada adicional ou configuração de Auth é acrescentada.

## SEC-29 — Resolução transacional vinculada à sessão (T22c12)

RPC service-only resolve movimentos após validar owner, sessão Auth vigente, revisão, capacidade transactions, consentimentos e lease não concluído. Devolver expiração real do lease e no máximo100 bindings técnicos, ordenados por conta interna; sem valores/PII, classe bancária inferida ou aprovação de cobertura. Contexto é interno, nunca DTO público. Ausência de item/bindings, mais100 bindings ou sessão/lease inválidos falham fechados. Migrations anteriores são imutáveis.

## SEC-30 — Portas REST de progresso de movimentações (T22c13)

Adaptadores internos limitam chamadas a resolve/claim/commit em RPCs fixas do Supabase próprio. Capturar escopo owner/conexão/revisão/lease/sessão e validar mês, hashesSHA256, nonce e contagem0–500 antes de rede. Transport injetado obrigatório, sem fetch implícito; disabled não inspeciona configuração/argumentos. Deadline20s/abort, JSON128KiB, sem cookies/redirecionamento e erros genéricos. Commit só aceita booleantrue. Claim valida nonceUUID, número1–100 e expiração futura até120s. Não serializar respostas internas como DTO público. Não ligar ao runtime ou habilitar finanças nesta task.

## SEC-31 — Coordenador HTTP de movimentações (T22c14)

POST /movements/read aceita somente connectionId/revision/leaseId/month/cursor. Auth deve confirmar owner e sessionId; resolver valida mesmo contexto e lease real antes de claim de hashSHA256 do cursor (null usa domínio rootv1). Claim precede provedor; nenhum retry interno. Após projeção, reautenticar mesma sessão, resolver novamente com contexto idêntico, confirmar página com contagem recebida e hash do próximo cursor antes de devolver DTO mínimo. Nunca liberar valores se claim/commit/consentimento/lease/sessão falhar. Prazo20s/abort/semcache, response até1MiB, sem IDs externos. Retorno final da paginação não prova cobertura nem finaliza lease global automaticamente. Entry point continua desabilitado.

## SEC-32 — Conclusão de lease após progresso transacional (T22c15)

Finalização transacional service-only exige sessão Auth vigente igual ao hash do progresso, revisão/lease atuais e progresso finished sem nonce pendente. Não é prova de cobertura bancária. Finalizador genérico preserva contas e failed/cancelled; success recusa se há progresso do mesmo lease incompleto. Sem progresso, sucesso genérico mantém significado legado de leitura de contas, nunca comprova transações. Nenhum valor financeiro é persistido; nenhum retry após finalização incerta.

## SEC-33 — Endpoint de finalização transacional (T22c16)

POST /movements/finalize aceita só connectionId/revision/leaseId; owner/sessão vêm do bearer validado duas vezes, mesma sessão, antes do RPC service-only de finalização. Deadline20s/abort/semcache, corpo16KiB e resposta apenas statuscomplete. REST destino fixo, nenhum fallback para finalização genérica. Disabled não lê portas ou argumentos. Nenhum runtime/deploy/gate muda nesta task.

## SEC-34 — JSON cliente por operação de movimentações (T22c17)

Somente operação movementRead no cliente de sessão usa leitor nomeado com teto fixo1MiB de bytesUTF8 antes de parse. Reader padrão conserva teto128KiB e discovery4KiB; movementFinalize também128KiB. Não aceitar orçamento arbitrário do chamador para ampliar operação. Rotas próprias fixas, deadline20s, origem da sessão, cancelamento/lock e headers privados mantidos. Sem persistência de payloads ou mudanças de gates/UI/publicação nesta task.

## SEC-35 — Transporte cliente e manifesto de movimentações (T22c18)

Transporte autenticado de uma tentativa captura contexto local e registryRLS permitido; não infere BANK de metadadosunknown. Primeira página retorna manifesto de IDs internos1–100, únicos/ordenados/subconjunto do registry, estável em todas páginas do mesmo lease. Validar DTO mínimo e envelope antes de entregar ao stager, sem IDs externos/owner/segredos no payload. Uma aquisição e paginação sequencial, sem retries/concorrência; cursor/lease/revisão/mês não mudam. Finalizar por endpoint dedicado apenas após página final, sem promover/cachear dados no transporte. Gates independentes desligados não inspecionam dependências.

## SEC-36 — Staging transacional iniciado pelo manifesto autorizado (T22c19)

Orquestrador de movimentações usa runReadBatch exclusivamente transactions. RegistryRLS delimita contas permitidas, mas o manifestoBANK vem da primeira página autorizada: só então criar stager, sem prefetch extra nem inferência de tipo. Capturar owner/conexão/instituição/mês e contexto local; exigir manifesto1–100internos ordenados/subconjunto do registry/estável. Promover ledger só após paginação completa, finalização dedicada e sessão/lease fresh. Erros/lock/abort limpam staging e preservam cache anterior ainda válido; nenhum valor persiste fora da memória.

## SEC-37 — Boot backend de movimentações com rede por escopo (T22c20)

Movimentações exigem codegate liveApproved, modo explícito e flags bridge/private/movement independentes. Chavesidentity/cursor distintas de32bytes, nãozero, somentebackend; ausentes/malformadas mantêmfeatureoff sem provisionar fallback. Auth/RPC usam rede própria restrita; port provedor é criado após resolver, com item/contas/mês capturados pela fronteira de transações e fechado nofinally. Primeira composição não compartilhaAPIkey entre páginas: custoAuth/página explícito, sem retries/cachefinanceiro. Máximo4requests, close aborta tudo e descarta chaves em best effort. Entrypoint publicado permanece literalfalse. Rotas conhecidas apenas; aquisição pode usar modo movimentos quando contas off, finalização sempre dedicada.

## SEC-38 — Patches compatíveis e revalidação da cadeia Expo (T22c21)

Corrigir drift apontado por expo install--check com patches do SDK57, sem migrarmajorSDK, suprimirchecks ou ampliar exceções de segurança. Instalaçãoignore-scripts; comparar fontesFetch/linking e registrar evidência de artefato instalado (não certificar binárioGo porisso). Repetircheck/compatibilidade/audit/export/runtimeaudit/scan; CI deve ficarverde antes de publicarcliente. Patches decompatibilidade não equivalem à liberaçãofinanceira.

## SEC-39 — Cache de sessão para batch transacional autorizado (T22c22)

SyncSession expõe runMovements separado para manifesto da primeira página, usando o mesmo mutex e AbortController das leituras existentes. Owner do armazenamento é UUID opaco local, não JWTsubject; contexto deve corresponder a esse escopo antes de adquirir lease. Lock/logout/close abortam batch, purgam ledger e recusam novas consultas; cancel descarta staging sem apagar cache válido. Sem transporte automático, persistência ou novas flags.

## SEC-40 — Controller de movimentações protegido e explícito (T22c23)

Controller só nasce com sessão desbloqueada e proteção ready/active. Refresh captura connectionId/mês, consulta status/capacidade/consentimento e registry autorizado antes do transporte, usando scopeId opaco do cache; BANK continua definido pelo manifesto do backend. Um refresh, prazo global120s e cancelamento de status/registry/transporte/lease ao fechar ou perder proteção. Snapshot só estados/avisos; valores consultados separadamente no ledger protegido, sem persistência. Runtime exige movementReads/live/private independentes e disabled não inspeciona dependências. categories/transferências confirmadas vazias inicialmente, sem inventar classificação. Sem ativação no rootUI nesta task.
