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
| SEC-05 | DEVE limitar saída de rede a destinos/finalidades aprovados; impedir valores/identificadores em URLs, Referer, eventos e recursos remotos; testar chamadas observáveis do runtime |
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
