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
