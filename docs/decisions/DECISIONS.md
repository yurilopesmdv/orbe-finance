# Registro de decisões

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
