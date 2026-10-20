# Prontidão do Orbe —20/10/2026

**Prévia hospedada publicada para Expo Go; funcionamento da prévia confirmado pelo titular. Não pronto para uso financeiro real.** Implementação do escopo bancário completo permanece condicionada aos gates abaixo. O projeto não foi encerrado como produto integrado.

## O que está disponível

| Parte | Entrega | Limite |
|---|---|---|
| Acesso | Ativação privada para definir senha e login do único proprietário, sessão volátil curta, bloqueio ao sair do primeiro plano, logout | Titular confirmou criação do acesso; retomada/Keychain/login específico ainda em validação no iPhone; senha nunca usada pelas ferramentas |
| Visão geral/carteira | Contas, investimentos, reservas, moedas e subtotal reconciliado | Dados inventados; reserva/meta não duplica patrimônio |
| Movimentos | Mês, banco, conta, tipo, categoria, busca, paginação e correção de classificação | Correções só na sessão demonstrativa; sem extrato importado |
| Relatórios | Categoria, drill-down com filtros, comparação mensal e composição por banco/classe | Valores ocultos também em labels; sem histórico patrimonial inventado ou rentabilidade |
| Metas | Criar, associar orçamento conhecido e remover | Volátil, sem movimentação de dinheiro |
| Minhas conexões | Após login: status autenticado, datas/capacidades, pausa e remoção com confirmação | Apenas metadados; lista vazia confirmada não é saldo zero. Remoção exige login recente e não revoga consentimento na origem |
| API de status | Função própria orbe-metadata v3 ACTIVE com Auth remoto, sessão ativa e RLS | Cinco testes HTTP negativos aprovados; HTTP positivo do titular fica no teste físico |
| Ponte financeira | Núcleos/normalizadores/leases/cancelamento em fixtures | Endpoint publicado orbe-bridge v1 permanece literalfalse/503; não acessa fornecedor |

## Evidências executadas

- `npm run check`: dois typechecks e **686 testes** locais aprovados, até T12b. Inclui acesso/RLS por fixture administrativa, limites de JSON, isolamento de sessão, status/control lifecycle, integridade monetária e relatórios.
- Export iOS Hermes **2,6MB** em T37b2b; token administrativo e UUID privado do titular ausentes nos25 artefatos examinados. Configuração pública do projeto é intencionalmente parte do cliente.
- SQL real próprio: sete migrations imutáveis; testes de RLS/sessão/read-only/pausa/remoção com identidades fictícias e rollback, zero resíduos e dono preservado. Evidência detalhada em [ponte](security/BRIDGE-CORE.md). Não é teste bancário.
- HTTP gerenciado: status anônimo401, token inventado401, método405, rota financeira404 e query400; erros genéricos/no-store. Financeirooff três503 confirmados.
- CI do código `eb9c865` aprovada: [execução](https://github.com/yurilopesmdv/orbe-finance/actions/runs/39428239529). Não confundir com CI de commit documental posterior sem conferir.
- Auditoria atual:19 pacotes afetados por duas raízes sem patch, exclusivamente exceção sintética até23/10/2026; **bloqueia dados reais**. [Detalhes](security/DEPENDENCIES.md).
- Scanner/export/check não demonstram ausência universal de vazamento. Não houve teste de conta bancária, fornecedor autenticado, captura de tráfego nativo completo ou invasão do aparelho.

## Teste final no iPhone —T38b/T53/T61

Direção atual: usar [QR remoto publicado](EXPO-PREVIEW.md), sem PC/Metro/rede local. Tentativa anterior LAN foi cancelada pelo titular. Primeira atualização hospedada abriu no iPhone mas caiu por scheme ausente; hotfix define schemeorbe e foi republicado, com manifesto conferido. Titular confirmou que a prévia corrigida funcionou perfeitamente em20/10/2026.

| Passo | Resultado esperado | Situação |
|---|---|---|
| Abrir pelo QR | Tela de demonstração sem erro do bundle/SDK | Hotfix abriu e funcionou, confirmado pelo titular |
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

Histórico: a falha LAN foi substituída por publicação remota conforme pedido do titular. Metro parado; diagnóstico firewall/túnel cancelados. Primeiro remoto foi executado no aparelho e revelou erro de scheme, corrigido em T44b e reproduzido em teste da biblioteca instalada. Novo update/QR em [EXPO-PREVIEW](EXPO-PREVIEW.md). Expo Go requer conta proprietária/membro do projeto.

Próxima ação: criar a senha pessoal com **Criar meu acesso** no novo QR e validar login/status/VoiceOver/bloqueio no aparelho, sem banco real. As tarefas financeiras futuras permanecem registradas, não concluídas por fixtures. [Checkpoint operacional](../roadmap/STATE.md) e [backlog](../tasks/TASKS.md).

T10c: acesso inicial pessoal publicado/638 testes e smoke OTP fictício aprovado; [instruções privadas](OWNER-ACCESS.md). Cadastro público permanece fechado. Identidade visual fica para próxima etapa por decisão do titular.

T12b publicada/CI aprovada; Keychain físico ainda pendente: [sessão lembrada sem senha salva](REMEMBERED-ACCESS.md), com SecureStore, rotação e owner/sessão verificados. Titular manteve Expo Go/orçamento zero; runtime privado financeiro será reavaliado em T65a com modo volátil, sem contratação nem supressão silenciosa dos controles.
