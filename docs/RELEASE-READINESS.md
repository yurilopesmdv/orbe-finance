# Prontidão do Orbe —20/10/2026

**Pronto para teste sintético no iPhone; aceite físico pendente. Não pronto para uso financeiro real.** Implementação do escopo bancário completo permanece condicionada aos gates abaixo. O projeto não foi encerrado como produto integrado.

## O que está disponível

| Parte | Entrega | Limite |
|---|---|---|
| Acesso | Login do único proprietário, sessão volátil curta, bloqueio ao sair do primeiro plano, logout | Login positivo no iPhone ainda precisa confirmação; senha nunca usada pelas ferramentas |
| Visão geral/carteira | Contas, investimentos, reservas, moedas e subtotal reconciliado | Dados inventados; reserva/meta não duplica patrimônio |
| Movimentos | Mês, banco, conta, tipo, categoria, busca, paginação e correção de classificação | Correções só na sessão demonstrativa; sem extrato importado |
| Relatórios | Categoria, drill-down com filtros, comparação mensal e composição por banco/classe | Valores ocultos também em labels; sem histórico patrimonial inventado ou rentabilidade |
| Metas | Criar, associar orçamento conhecido e remover | Volátil, sem movimentação de dinheiro |
| Minhas conexões | Após login: status autenticado, datas/capacidades, pausa e remoção com confirmação | Apenas metadados; lista vazia confirmada não é saldo zero. Remoção exige login recente e não revoga consentimento na origem |
| API de status | Função própria orbe-metadata v3 ACTIVE com Auth remoto, sessão ativa e RLS | Cinco testes HTTP negativos aprovados; HTTP positivo do titular fica no teste físico |
| Ponte financeira | Núcleos/normalizadores/leases/cancelamento em fixtures | Endpoint publicado orbe-bridge v1 permanece literalfalse/503; não acessa fornecedor |

## Evidências executadas

- `npm run check`: dois typechecks e **613 testes** locais aprovados, até T11d. Inclui acesso/RLS por fixture administrativa, limites de JSON, isolamento de sessão, status/control lifecycle, integridade monetária e relatórios.
- Export iOS Hermes **2,6MB** em T37b2b; token administrativo e UUID privado do titular ausentes nos25 artefatos examinados. Configuração pública do projeto é intencionalmente parte do cliente.
- SQL real próprio: sete migrations imutáveis; testes de RLS/sessão/read-only/pausa/remoção com identidades fictícias e rollback, zero resíduos e dono preservado. Evidência detalhada em [ponte](security/BRIDGE-CORE.md). Não é teste bancário.
- HTTP gerenciado: status anônimo401, token inventado401, método405, rota financeira404 e query400; erros genéricos/no-store. Financeirooff três503 confirmados.
- CI do código `fb80fb8` aprovada: [execução](https://github.com/yurilopesmdv/orbe-finance/actions/runs/39414272566). Não confundir com CI de commit documental posterior sem conferir.
- Auditoria atual:18 pacotes afetados por duas raízes sem patch, exclusivamente exceção sintética até23/10/2026; **bloqueia dados reais**. [Detalhes](security/DEPENDENCIES.md).
- Scanner/export/check não demonstram ausência universal de vazamento. Não houve teste de conta bancária, fornecedor autenticado, captura de tráfego nativo completo ou invasão do aparelho.

## Teste final no iPhone —T38b/T53/T61

Ambiente preparado com `npm start -- --lan --port 8083`, launcher segregado/offline/sem telemetria CLI; não usar túnel. Endereço desta sessão: `exp://192.168.18.7:8083`, QR gerado localmente e enviado no chat. É endereço transitório de desenvolvimento, não link de produção. O host no cabo e o iPhone no Wi-Fi precisam ter comunicação permitida no roteador; estar no mesmo range de IP não comprova isso.

| Passo | Resultado esperado | Situação |
|---|---|---|
| Abrir pelo QR | Tela de demonstração sem erro do bundle/SDK | Bloqueado: titular reportou carregamento infinito |
| Explorar sem login | Quatro abas, somente inventados; valores inicialmente ocultos | Pendente no aparelho |
| Relatório→categoria→voltar | Mesmo filtro/contexto e total reconciliado; leitor de tela sem valores ocultos | Pendente no aparelho |
| Entrar com a própria conta | Senha digitada somente no iPhone, acesso do proprietário | Pendente no aparelho |
| Meu acesso→Minhas conexões | Status confirmado ou erro explícito; vazio diz “Nenhuma conexão cadastrada” | Pendente no aparelho |
| Abrir multitarefa/bloquear/retomar | Sessão bloqueada, sem resposta tardia restaurar conteúdo | Pendente no aparelho |
| Sair e entrar novamente | Senha não preenchida pelo estado do app, nenhum status da sessão anterior | Pendente no aparelho |
| VoiceOver/texto maior | Ações/estados legíveis; confirmar/cancelar sem depender de cor | Pendente no aparelho |
| Pausa/remoção | Modal/recência/estado fresco, sem retry automático | Coberto por fixtures; não criar conexão real só para testar |

Não enviar e-mail, senha, prints privados, tokens ou dados bancários no chat. Informar somente etapa e comportamento genérico. Falha da LAN impede o teste físico; não alterar firewall/roteador de outros serviços automaticamente. Captura/alternador/teclado e cache HTTP nativo continuam sem homologação física.

## Pendências que impedem finalizar o produto bancário

| Gate | O que falta | Próximo passo |
|---|---|---|
| Runtime privado T65–T67/FaceID | Expo Go não oferece os controles de Face ID/SQLCipher assumidos para uso real | Decisão específica de distribuição privada, chaves/armazenamento/captura e testes; não substituir silenciosamente o pedido de Expo Go |
| Segurança de dependências T54 | Duas raízes altas sem patch e inspeção de alcance ainda incompleta | Revisar correção/mitigação e cadeia de update; não usar auditfixforce nem herdar exceção sintética |
| Fornecedor/privacidade T47/T51b/T52/T63/T78 | Termos/subprocessadores/retencão/logs e IDs exigidos em URLs upstream ainda sem decisão compatível com SEC-05 | Resolver contrato e desenho de rede/logs antes do adapter ativo ou consentimento |
| Integração T18c/T19b2/T76 | Adapter real/provisionamento privado e prova de origem Open Finance | Só depois dos gates; não pedir senha bancária ou credencial Pluggy para liberar experimentalmente |
| Cobertura T41/T42/T77 | PF Bradesco/MP, investimentos/cofrinhos e atualização ainda não homologados | Comparação privada posterior ao consentimento autorizado; ausência não é zero |
| Recuperação T11c | SMTP revisado e entrega de código não comprovados | Tarefa própria com o titular. configure-client mantém recoveryfalse e não altera template/SMTP |
| Histórico T60c2 | Pelo menos dois snapshots patrimoniais autorizados existentes | Não gerar evolução ou rentabilidade fictícia; ausência de histórico permanece explícita |

Diagnóstico após retorno: Metro escuta*:8083, status/manifest SDK57 e bundle dev5,8MB compilam no host, com PAT/ownerUUID ausentes. Titular reportou carregamento infinito; não houve aceite físico. Firewall não pôde ser lido sem sudo, estado solicitado ao titular. Ping no IP antigo sem resposta não prova firewall. Expo Go está logado (confirmado pelo titular); perfil CLI próprio offline ainda precisa ajuste.

A documentação oficial exige mesma conta no Expo Go e no CLI para iPhone físico: https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/. Próxima T38c prepara login pelo navegador/perfil exclusivo e modo online explícito, sem herdar credenciais F1. Não é motivo para liberar túnel ou finanças reais.

Próxima ação independente: preparar T38c e consolidar resultado físico quando o titular responder. Sem ele, T38b permanece pendente; não marcar R1 aceita. As tarefas financeiras futuras permanecem registradas, não concluídas por fixtures. [Checkpoint operacional](../roadmap/STATE.md) e [backlog](../tasks/TASKS.md).
