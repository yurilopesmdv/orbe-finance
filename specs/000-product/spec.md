# SPEC-000 — Produto e escopo

**Revisão vigente 0.4:** [SPEC-009](../../specs/009-meu-pluggy/spec.md) seleciona Meu Pluggy para integração automática Bradesco/Mercado Pago PF. [Plano vigente](../../plan/MEU-PLUGGY.md). Esta revisão prevalece sobre escolhas conflitantes abaixo; Open Finance é a única origem financeira admitida. Pesquisa pública permite seguir no planejamento, sem aprovação de dados reais.

Estado: draft. Origem: solicitações e respostas do usuário em 16/10/2026.

## Problema e resultado desejado

Orbe Finance reúne a visão das finanças pessoais do proprietário: dinheiro nas contas, investimentos, reservas e gastos por categoria. Deve permitir saber quanto há, onde está, quando foi atualizado e como o dinheiro foi gasto, com visão consolidada e origem clara dos dados.

Usuário inicial: uma pessoa, no próprio iPhone, usando Expo Go. Prioridade vigente: Mercado Pago e Bradesco, contas PF confirmadas. Inter e Nubank estavam no pedido inicial e ficam como expansão futura. Prioridade de custo da integração: gratuita para uso pessoal. Não foi solicitado serviço comercial para terceiros.

## Requisitos

| ID | Requisito | Release |
|---|---|---|
| PRD-01 | DEVE consolidar Bradesco e Mercado Pago com status individual de cobertura e atualização; não prometer cobertura total sem evidência real | R1/R2 |
| PRD-02 | DEVE separar saldo de contas, investimentos, reservas e gastos; dados ausentes não equivalem a zero | R1/R2 |
| PRD-03 | DEVE oferecer gastos por tipo e categoria, com correção pelo usuário e relatórios internos aprofundáveis (SPEC-007) | R1 |
| PRD-04 | DEVE funcionar inicialmente em Expo Go no iPhone e exigir senha de acesso; dados reais dependem do gate de SPEC-006 | R1 |
| PRD-05 | DEVE priorizar integração pessoal gratuita; qualquer plano pago permanece fora da contratação atual e privacidade prevalece sobre gratuidade | R0/R2 |
| PRD-06 | DEVE documentar specs, plano, microtasks, evidências e checkpoint de continuidade | R0 e todas |
| PRD-07 | DEVE manter dados e infraestrutura independentes do Bolão F1 | Todas |
| PRD-08 | DEVE apresentar acesso ao Face ID já cadastrado no iOS quando o runtime permitir, sem cadastrar rosto no Orbe | R3 condicionada |

## Entregas incrementais vigentes

- R0: specs/contratos, pesquisa e roadmap.
- R1: acesso, domínio e telas com respostas inteiramente sintéticas.
- R2: integração Open Finance Meu Pluggy, Bradesco/Mercado Pago PF, após gate de dados reais e homologação privada por produto.
- R3: Face ID no ambiente nativo compatível, após validação em aparelho.

Implementação autorizada em 16/10/2026, uma task por vez. Não conectar banco real ou contratar serviço nesta preparação.

## Fora do MVP

Pagamentos, Pix, iniciar aplicações/resgates, recomendação de ativos, assessoria, cálculo fiscal/IR, rentabilidade auditada, cotações em tempo real, empréstimos detalhados, conta familiar, usuários públicos, Android, site de gestão, App Store e IA sobre dados bancários. Cartões/faturas completos são fase posterior; se o provedor trouxer compras de cartão, seu tratamento e o pagamento da fatura devem evitar duplicidade desde a primeira inclusão.

BRL é a moeda inicial. Valores em outras moedas ficam separados e sinalizados; não entram em um total convertido sem uma spec futura de câmbio. Orçamentos mensais, recorrências preditivas e notificações push ficam em backlog. A origem financeira será exclusivamente Open Finance.

## Critérios de sucesso

A integração automática A1 só pode ser declarada completa se houver evidências dos dois bancos prioritários ou aceite explícito de escopo reduzido. Conta autenticada de teste não basta para validar segurança: testes devem tentar acesso cruzado com segunda identidade. Consolidado deve ser reconciliável até cada fonte e excluir valores duplicados. Falhas parciais devem permanecer visíveis.

## Premissas e questões abertas

Não foi informado em quais bancos existem reservas nem os modelos dos produtos. Conta PF está confirmada; BRL permanece moeda inicial. T01 registrou iPhone 11, iOS 26.6.2, Expo Go 57.0.9 com suporte SDK 57.0.0, informados pelo proprietário; base selecionada SDK 57. Compatibilidade física do app ainda será testada em T07/T38. O nome Orbe Finance é de trabalho; marca/domínio não foram verificados.

## Revisão de privacidade e relatórios

Pedido posterior de 16/10/2026: simplicidade de UI com profundidade de análise e prioridade estrita de confidencialidade. SPEC-006 bloqueia uso real até fornecedor/runtime/controles serem avaliados; SPEC-007 define relatórios dentro do app. R1 permanece sintética. R2 agora depende também do gate de segurança e decisão explícita sobre acesso de provedores; nenhum deles está aprovado. Não prometer risco zero ou conexão Open Finance sem processamento por terceiros.
