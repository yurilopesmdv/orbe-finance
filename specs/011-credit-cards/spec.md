# SPEC-011 — Cartões, faturas e compras

Estado: planejamento, implementação ainda não iniciada. Pedido do titular em23/10/2026. Uso pessoal, Mercado Pago e Bradesco, com o mesmo Meu Pluggy/Open Finance e controles de sessão existentes. Sem pagamento de faturas pelo app, serviços pagos ou autorização bancária pelas ferramentas.

## Situação atual

O inventário técnico reconhece contas CREDIT para validar vínculos, mas a projeção de saldos as exclui e o manifesto de movimentos inclui somente BANK. Não existe integração completa de cartão, faturas ou parcelas. O saldo de cartão não pode ser tratado como dinheiro disponível: no Open Finance a Pluggy o documenta como limite utilizado.

## Requisitos

| ID | Comportamento |
|---|---|
| CARD-01 | Reconhecer cartão por type=CREDIT/subtype=CREDIT_CARD, vinculado ao banco/owner/item verificados. Cartão adicional não vira outro banco. Não inferir cartão por nome ou número. |
| CARD-02 | Consultar resumo e limite disponível/total somente quando fornecidos, mantendo moeda, centavos exatos, origem, data e null. Não somar limite ou dívida ao saldo positivo de contas. Não afirmar dívida exigível usando apenas limite utilizado. |
| CARD-03 | Listar faturas por cartão, vencimento, total, mínimo, pagamentos e encargos disponíveis; ausência/falha não significa fatura paga ou zerada. Vencimento passado não comprova inadimplência. Não inventar data de fechamento. |
| CARD-04 | Consultar compras por cartão/fatura com paginação limitada, idempotência, valor, moeda, estorno, status e campos de parcela realmente presentes. Separar POSTED de PENDING, fatura aberta de compras futuras. |
| CARD-05 | Compra, pagamento da fatura, estorno e transferência têm papéis distintos. Compra de100 e débito bancário de100 para pagar fatura geram consumo100, não200. Correspondência exige vínculo/proveniência ou regra confirmada, nunca somente descrição. Sem prova, marcar conciliação pendente e totais parciais. |
| CARD-06 | Exibir parcela atual/total quando fornecidos; não multiplicar valor da parcela por total no consumo mensal. Não reconstruir compras futuras ausentes ou agrupá-las silenciosamente por semelhança. |
| CARD-07 | Home tem resumo compacto Cartões/Faturas, separado de saldo e investimentos; detalhe por banco/cartão/fatura e link para compras. Moedas distintas não são somadas; itens podem ser ocultados pelo controle central. |
| CARD-08 | Reusar hub/filaúnica/memória/purge, mutex por banco e consentimento/revisão/sessão. Cada leitura de cartão/fatura exige ownership do cartão e capability específica comprovada. Flags independentes inicialmente false. Não reutilizar lease de contas para produto novo. |
| CARD-09 | Nenhum número completo de cartão, CVV, senha, titular, documento ou segredo no cliente/DB/logs. Alias mínimo e últimos4 somente se necessário e fornecido; nunca número completo. IDs externos ficam servidor. Texto bancário é dado não executável. |
| CARD-10 | Persistir apenas vínculos/progresso técnicos necessários, com RLS e RPCs service-only como os produtos existentes; compras/limites/faturas continuam somente no cache privado volátil do titular. Nenhuma consulta financeira real por ferramentas para homologar. |

## Contratos e cobertura a confirmar antes da ativação

- `/accounts?itemId=…`: documentação define BANK e CREDIT/CREDIT_CARD e `creditData`. Manifesto atual descarta CREDIT; estender de forma segregada.
- `/bills?accountId=…`: faturas, paginação por página; vincular accountId a cartão próprio, páginas/limite/tamanho e contagem coerentes. A documentação aponta suporte das faturas no regulado; o proxy Meu Pluggy e cada banco ainda exigem validação na sessão do titular. Não deduzir cobertura apenas do banco conectado.
- `/transactions` ou rota de cursor já suportada: ler compras do cartão e associação `billId` quando disponível. Validar contrato de cursor/consulta antes de escolher a rota; não substituir paginação segura existente por listagem ilimitada.
- Nunca usar links de payload, URLs arbitrárias ou endpoint MCP/IA para buscar finanças. Não habilitar webhook/cron ou export nesta fatia.

## Exemplos de aceite

1. Saldo bancário1000, limite disponível2000 e compras100: home mantém saldo1000; cartão exibe limite e compromissos em área separada.
2. Compra100 + pagamento bancário100 da mesma fatura: consumo100, saída de caixa100, nunca consumo200. Sem relação comprovada, relatório explica conciliação pendente.
3. Parcela2/6 de50: consumo do período50; total300 só aparece se fornecido e rotulado como valor total da compra.
4. Crédito/estorno20 não vira receita salarial; pagamento não vira nova compra.
5. Cartão Mercado Pago e Bradesco têm IDs internos distintos. Usar cartão/fatura de outro banco/owner/revisão ou lease de contas falha antes da fonte.
6. Falha na segunda página não promove fatura incompleta como completa; mantém snapshot válido anterior e sinaliza parcialidade. Lock/background/logout abortam e limpam todos os detalhes.
7. Datas/faturas ausentes, compra PENDING, moedas diferentes, dívida negativa/saldo credor, sem limite informado e nenhum cartão disponível têm estados explícitos, sem zero inventado.
8. Fatura já paga com vencimento passado não é marcada como inadimplente apenas pela data.

## Fontes primárias consultadas23/10/2026

- [Contas e semântica de saldo/creditData](https://docs.pluggy.ai/en/docs/products/accounts)
- [Faturas e cobertura](https://docs.pluggy.ai/en/docs/products/credit-card-bills)
- [Lista de faturas](https://v2.docs.pluggy.ai/en/reference/bill/bills-list)
- [Transações de BANK/CREDIT e status](https://docs.pluggy.ai/en/docs/products/transactions)
- [Parcelas e limites de agrupamento](https://docs.pluggy.ai/en/docs/products/credit-card-installments)

Os limites são evidência do contrato público, não confirmação de dados disponíveis nas contas do titular. Plano de microtasks: [T80](../../plan/T80-CREDIT-CARDS.md).
