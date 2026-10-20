# Registro de decisões

**Revisão vigente 0.4:** [SPEC-009](../../specs/009-meu-pluggy/spec.md) seleciona Meu Pluggy para integração automática Bradesco/Mercado Pago PF. [Plano vigente](../../plan/MEU-PLUGGY.md). Esta revisão prevalece sobre escolhas conflitantes abaixo; Open Finance é a única origem financeira admitida. Pesquisa pública permite seguir no planejamento, sem aprovação de dados reais.

Data inicial: 16/10/2026. Estados: accepted (restrição/pedido confirmado), proposed (escolha a validar), deferred (fora da etapa). Uma mudança registra motivo, impacto em requisitos/tasks e evidência. Este arquivo não autoriza implementação.

## ADR-001 — Distribuição e autenticação

Estado: accepted para Expo Go + senha inicial; Face ID deferred. Contexto: uso no iPhone pessoal, sem publicação em loja. Decisão: cumprir o runtime solicitado e manter biometria em R3, conforme limitação documentada em [pesquisa](../research/FEASIBILITY.md). Senha e reautenticação funcionam antes da integração bancária. Alternativa futura: development build com biometria nativa; custo/distribuição/Apple Developer serão investigados quando necessário. Não escolher instalação nativa sem ciência do usuário.

## ADR-002 — Agregação pessoal

Estado: proposed. Candidato de custo suspenso para uso real até gate de SPEC-006. Avaliar Meu Pluggy + proxy MeuPluggy para o próprio titular, após resposta do usuário por custo gratuito. Provar contas, investimentos e reservas dos quatro bancos. Não usar trial comercial como gratuidade recorrente nem assumir que contrato comercial seja necessário ao caminho pessoal documentado. Consequências: onboarding no portal, IDs provisionados operacionalmente, capacidades variáveis e cadência limitada. Migração de fornecedor não presume portabilidade de IDs/histórico.

## ADR-003 — Backend independente

Estado: proposed. Expo/React Native/TypeScript no cliente e Supabase Auth/Postgres/Functions no servidor, em projeto próprio. Escolha suspensa para dados reais até revisão de confiança e criptografia. A proposta aproveita experiência operacional do mantenedor, sem copiar policies/configurações do Bolão F1. Separar sessão, dados financeiros, segredos de provedor e agendamento. Validar plano gratuito, limites de execução, fila durável, e-mail e armazenamento antes de provisionar. Um projeto Supabase existente não será alterado por conveniência.

## ADR-004 — Modelo monetário e reconciliação

Estado: proposed. Centavos inteiros para dinheiro BRL, decimal para quantidade/taxa, valores ausentes preservados, data de fonte explícita. Componente de ativo pode estar incluído em outro; reserva é alocação/visão e não saldo adicional. Classificação manual separada da transação importada. Consequência: um total pode ser parcial até reconciliar a fonte; isso é informação de produto, não erro escondido.

## ADR-005 — Continuidade e organização

Estado: accepted como método de planejamento. Specs identificadas, plano dependente, microtasks pequenas e checkpoint em Git. Trabalho paralelo futuro deve receber escopo de arquivos, IDs e critério de aceite, com um integrador para alterações compartilhadas. Nenhuma execução de agentes paralelos foi realizada nesta entrega. Checkpoint ao terminar tarefa ou antes de interrupção; não depender de memória do chat, de janela fixa de cinco horas ou de execução agendada.

## ADR-006 — Provisionamento de conexões no MVP

Estado: proposed. O titular autoriza no provedor; backend registra somente itens verificados com a credencial daquele projeto e proprietário. Nenhum endpoint público aceita arbitrariamente itemId/owner_id. Metadados de cliente e callbacks servem para correlação, não prova de ownership. Fluxo integrado com widget/banco fica posterior ao teste de runtime e não bloqueia a leitura pessoal inicial se a vinculação operacional for válida.

## ADR-007 — Privacidade antes da integração

Estado: accepted como prioridade do usuário; arquitetura de proteção ainda proposed. Sem dados financeiros reais em ferramentas de desenvolvimento, chats, IA/MCP, logs e CI. Provedores ainda não aprovados; nenhum consentimento bancário será usado como experimento de revisão. Gratuidade não compensa lacuna crítica de tratamento. Acesso autorizado de processador não é vazamento, mas continua uma confiança a decidir.

## ADR-008 — Runtime sintético e escolha antes de dados reais

Estado: proposed para mudança da distribuição real; sintéticos permanecem permitidos na fase técnica futura autorizada. Expo Go não será assumido como ambiente final só por compilar. Avaliar build privado, controles contra inspeção/captura e cadeia de update; não dizer que development build sozinho resolve. A exigência literal de eliminar todas as vias de vazamento não é demonstrável; riscos residuais devem ser informados antes do uso real.

## ADR-009 — Relatórios internos, sem novas saídas

Estado: proposed. Aprovar detalhe progressivo e cálculos determinísticos, com dados autorizados do próprio app, sem IA/BI/render remoto. Exportação e compartilhamento permanecem fora do MVP; relatórios não criam novos destinatários e usam os mesmos controles de acesso dos lançamentos.

## ADR-010 — persistência no aparelho

A antiga arquitetura autônoma foi substituída. [Registro atualizado](ADR-010-LOCAL-CORE.md). Origem financeira exclusiva Open Finance via Meu Pluggy, Bradesco/Mercado Pago PF prioritários; execução autorizada uma task por vez.

## ADR-011 — Ponte de leitura mínima

Estado: accepted para preparação sintética em T74. [Contrato](../../plan/T74-BRIDGE-CONTRACT.md). Supabase Auth/Functions em projeto independente, RLS de metadados, nenhum armazenamento financeiro no servidor Orbe. Relatórios no aparelho; coleta bancária automática no fornecedor e consulta local ao abrir. Cron/webhooks adiados; conexão original deve comprovar Open Finance. Cobertura e gratuidade dessa trilha não presumidas. Dados reais dependem dos gates já definidos.

## ADR-012 — Separação entre status autenticado e ingestão

Estado: accepted para implementação local sintética em T18b3a,20/10/2026. Metadados exigem Auth e sessão ativa, mas não autorização bancária. Criar factory de runtime somente para status, com configuração pública capturada uma vez e falha fechada. Não reutilizar a ativação financeira para liberar status. Publicação separada exige T18b3b e revisão do helper/artefatos; endpoint orbe-bridge já publicado permanece desligado. Não há aprovação de consentimento, dados financeiros reais ou fornecedor por esta decisão.

## ADR-013 — Primeiro acesso pessoal, cadastro público adiado

Estado: accepted20/10/2026 pelo titular: inicialmente apenas ele, preparar outros cadastros porém manter desabilitado. Conservar identidade/owner/RLS e signups fechados. Ativação de senha da identidade provisionada usa OTP recovery gerado pelo administrador sem e-mail, em arquivo privado fora Metro; senha definida somente no iPhone pelo titular. Isso evita inventar um fluxo de entrega SMTP ou trocar dono por conveniência. UI chama “Criar meu acesso” e explica ativação privada. Preparação de signup cliente permanece desligada e não equivale a suporte multiusuário aprovado. Identidade visual e cores ficam para etapa posterior.

## ADR-014 — sessão lembrada no Expo Go sem senha persistida

Aceita para implementação sintética20/10/2026, por pedido explícito do titular de orçamento zero/Expo Go e login rápido. Usar refresh token rotativo do Supabase em SecureStore do projeto/Keychain WHEN_PASSCODE_SET_THIS_DEVICE_ONLY, prazo local30dias, nenhuma senha/access token/dado financeiro persistidos. Restabelecer online após Auth/owner/sessão ativos; foreground lock não revoga sessão lembrada, logout explícito limpa/revoga. Não reduzir RLS/senha recente de remoção. Face ID e requireAuthentication não disponíveis nesse Expo Go/iPhone; aparelho desbloqueado é fronteira residual de acesso. Sem custo contratado, sem liberação bancária ou promessa de risco zero. Fontes: docs Expo SecureStore (documentação da versão57 indisponível na consulta; interface confirmada no pacote57.0.4 instalado e módulos nativos SDK57), LocalAuthentication57 e Supabase sessions/refresh rotation. T65a avalia separadamente runtime financeiro real.

## ADR-015 — IDs opacos necessários à REST API somente no backend

20/10/2026, refinamento técnico dentro do caminho de integração delegado pelo titular, sem consentimento bancário. A proibição literal anterior de todo identificador em URL inviabilizava a API REST escolhida, que exige itemId/accountId. Manter proibição integral para PII/valores/tokens/IDs internos/Auth e todas as URLs do cliente; admitir somente IDs técnicos do fornecedor em HTTPS ao host oficial pelo backend após ownership resolvido, sem Referer/redirect/log/erro bruto. Não usar uma URL devolvida pela fonte como destino. O fornecedor necessariamente recebe os próprios identificadores e processa os dados; suas retenções/logs continuam pendentes e gate financeiro fechado. Não declarar essa necessidade técnica como vazamento a destinatário não autorizado, nem ocultar o risco do processador.

Documentação atual orienta /v2/transactions com cursor; /transactions está obsoleto até31/12/2026. next é query pronta: preservar byte a byte após conferir accountId/filtros/chaves/encoding e fixar endpoint/host. Futura composição validará owner/sessão/lease antes do builder; ele sozinho não autentica ninguém. T51b2a é sintética/pura, sem credenciais ou rede.

## ADR-016 — Modos fixture/live explícitos, aprovação independente

20/10/2026. O encadeamento técnico foi desenvolvido com fixtureOnly e transporte injetado. Usar fixturetrue num entrypoint real ocultaria a mudança de fronteira. Introduzir ExecutionPolicy com modefixture/modelive; defaultoff, live requer privateDataApprovedtrue no contrato lowlevel e flags independentes/estado/consentimento no bootalto. Manter fixtureOnlytrue como compatibilidade de testes, incompatível com modelive. Mode é capacidade técnica, não comprovação de revisãofornecedor/OF/dependências ou liberação do produto. Propagar modo, sem flagsfixas de fixture nas chamadas internas do fluxo real. Não modificar entrypointpublicado nesta mudança.

ADR-016 complementoMPG-45: composiçãoalta exige liveApprovedtrue fixado pelo chamador de boot e flags ORBE_BRIDGE_ENABLED/feature/ORBE_PRIVATE_DATA_APPROVED literaistrue antes de carregar segredos. Fixture não tem fetchpadrão; live usa fetchsomenteapósgates e sempreatravés da rede literal. EntryPoint publicado continua desligado; alterar mode sozinho não ativa nada.
