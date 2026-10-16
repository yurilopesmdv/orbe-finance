# SPEC-000 — Produto e escopo

Estado: draft. Origem: solicitações e respostas do usuário em 16/10/2026.

## Problema e resultado desejado

Orbe Finance reúne a visão das finanças pessoais do proprietário: dinheiro nas contas, investimentos, reservas e gastos por categoria. Deve permitir saber quanto há, onde está, quando foi atualizado e como o dinheiro foi gasto, sem exigir alternar entre quatro bancos.

Usuário inicial: uma pessoa, no próprio iPhone, usando Expo Go. Instituições solicitadas: Mercado Pago, Bradesco, Inter e Nubank. Prioridade de custo da integração: gratuita para uso pessoal. Não foi solicitado serviço comercial para terceiros.

## Requisitos

| ID | Requisito | Release |
|---|---|---|
| PRD-01 | DEVE consolidar os quatro bancos com status individual de cobertura e atualização; não prometer cobertura total sem evidência real | R1/R2 |
| PRD-02 | DEVE separar saldo de contas, investimentos, reservas e gastos; dados ausentes não equivalem a zero | R1/R2 |
| PRD-03 | DEVE oferecer gastos por tipo e categoria, com correção pelo usuário | R1 |
| PRD-04 | DEVE funcionar inicialmente em Expo Go no iPhone e exigir senha de acesso | R1 |
| PRD-05 | DEVE priorizar integração pessoal gratuita; qualquer plano pago permanece fora da contratação atual | R0/R2 |
| PRD-06 | DEVE documentar specs, plano, microtasks, evidências e checkpoint de continuidade | R0 e todas |
| PRD-07 | DEVE manter dados e infraestrutura independentes do Bolão F1 | Todas |
| PRD-08 | DEVE apresentar acesso ao Face ID já cadastrado no iOS quando o runtime permitir, sem cadastrar rosto no Orbe | R3 condicionada |

## Entregas incrementais

- **R0 — Planejamento atual:** somente Markdown, pesquisa e contratos; nenhum app, configuração executável, instalação, recurso cloud ou conexão bancária.
- **R1 — Base pessoal:** autenticação restrita, shell iPhone, modelo financeiro e visualização com cenários sintéticos; categorização manual e regras determinísticas. Dados sintéticos identificados, sem insinuar banco conectado.
- **R2 — Consolidação real:** integração pessoal, sincronização de contas/transações/investimentos, reconciliação de reservas, consentimentos, tratamento de falhas e teste no iPhone do proprietário. Cada banco é homologado separadamente. R1 não substitui esta entrega do pedido original.
- **R3 — Biometria nativa:** condicionada à decisão de adotar development build/distribuição compatível. Não pertence ao aceite Expo Go.

## Fora do MVP

Pagamentos, Pix, iniciar aplicações/resgates, recomendação de ativos, assessoria, cálculo fiscal/IR, rentabilidade auditada, cotações em tempo real, empréstimos detalhados, conta familiar, usuários públicos, Android, site de gestão, App Store e IA sobre dados bancários. Cartões/faturas completos são fase posterior; se o provedor trouxer compras de cartão, seu tratamento e o pagamento da fatura devem evitar duplicidade desde a primeira inclusão.

BRL é a moeda inicial. Valores em outras moedas ficam separados e sinalizados; não entram em um total convertido sem uma spec futura de câmbio. Orçamentos mensais, recorrências preditivas, CSV/OFX e notificações push ficam em backlog, sem serem necessários para provar a integração real.

## Critérios de sucesso

R2 só pode ser declarada completa se houver evidências dos quatro bancos ou aceite explícito de escopo reduzido. Conta autenticada de teste não basta para validar segurança: testes devem tentar acesso cruzado com segunda identidade. Consolidado deve ser reconciliável até cada fonte e excluir valores duplicados. Falhas parciais devem permanecer visíveis.

## Premissas e questões abertas

Não foi informado em quais bancos existem reservas nem os modelos dos produtos. Conta PF e moeda BRL são premissas a confirmar antes da homologação. Modelo do iPhone, versão iOS e SDK compatível com Expo Go serão registrados antes do bootstrap. O nome Orbe Finance é de trabalho; marca/domínio não foram verificados.
