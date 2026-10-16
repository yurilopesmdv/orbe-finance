# SPEC-000 — Produto e escopo

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

- **R0 — Planejamento atual:** somente Markdown; nenhum app, recurso cloud, credencial ou conexão bancária.
- **L0/L1 — Base local:** contrato/runtime, senha/chaves e dados sintéticos; sem autenticação cloud ou backend financeiro obrigatório.
- **L2/L3 — Gestão local:** entrada/importação conforme layout oficial, classificação, investimentos/cofrinhos e relatórios no aparelho. Uso real só após comprovar controles e limites; não equivale a sync automática.
- **A0/A1 — Automação pendente:** acesso direto PF será avaliado separadamente; se elegível, nova revisão de contrato/segredos antes de habilitar. Integração automática continua parte do objetivo, ainda não comprovada.

A trilha anterior gerenciada R1/R2/R3 foi subordinada à decisão local da SPEC-008. Face ID pertence ao ambiente nativo compatível após teste, não ao Expo Go.

## Fora do MVP

Pagamentos, Pix, iniciar aplicações/resgates, recomendação de ativos, assessoria, cálculo fiscal/IR, rentabilidade auditada, cotações em tempo real, empréstimos detalhados, conta familiar, usuários públicos, Android, site de gestão, App Store e IA sobre dados bancários. Cartões/faturas completos são fase posterior; se o provedor trouxer compras de cartão, seu tratamento e o pagamento da fatura devem evitar duplicidade desde a primeira inclusão.

BRL é a moeda inicial. Valores em outras moedas ficam separados e sinalizados; não entram em um total convertido sem uma spec futura de câmbio. Orçamentos mensais, recorrências preditivas e notificações push ficam em backlog. SPEC-008 promove entrada/importação local à primeira fatia, usando somente formatos oficiais confirmados; CSV/OFX são candidatos, não disponibilidade garantida.

## Critérios de sucesso

A integração automática A1 só pode ser declarada completa se houver evidências dos dois bancos prioritários ou aceite explícito de escopo reduzido. Conta autenticada de teste não basta para validar segurança: testes devem tentar acesso cruzado com segunda identidade. Consolidado deve ser reconciliável até cada fonte e excluir valores duplicados. Falhas parciais devem permanecer visíveis.

## Premissas e questões abertas

Não foi informado em quais bancos existem reservas nem os modelos dos produtos. Conta PF está confirmada; BRL permanece moeda inicial. Modelo do iPhone, versão iOS e SDK compatível com Expo Go serão registrados antes do bootstrap. O nome Orbe Finance é de trabalho; marca/domínio não foram verificados.

## Revisão de privacidade e relatórios

Pedido posterior de 16/10/2026: simplicidade de UI com profundidade de análise e prioridade estrita de confidencialidade. SPEC-006 bloqueia uso real até fornecedor/runtime/controles serem avaliados; SPEC-007 define relatórios dentro do app. R1 permanece sintética. R2 agora depende também do gate de segurança e decisão explícita sobre acesso de provedores; nenhum deles está aprovado. Não prometer risco zero ou conexão Open Finance sem processamento por terceiros.

## Revisão 0.3 vigente

O usuário delegou caminho técnico e confirmou PF. [SPEC-008](../008-personal-data/spec.md) e [plano PF](../../plan/PF-IMPLEMENTATION.md) governam a primeira fatia: núcleo local, duas instituições prioritárias e entrada local como contingência. A trilha gerenciada anterior não autoriza backend/agregador por padrão. O objetivo de integração automática não foi descartado nem atendido; permanece separado e dependente de viabilidade oficial.
