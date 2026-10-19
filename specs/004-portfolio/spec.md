# SPEC-004 — Contas, investimentos e cofrinhos

Estado: ready para R1 sintética; dados reais continuam bloqueados. Depende de SPEC-000/002. A carteira organiza fatos importados e reservas; não inicia movimentação de dinheiro.

| ID | Requisito |
|---|---|
| PORT-01 | DEVE mostrar saldo contábil/disponível/reservado com semântica explícita, instituição, moeda e data de referência |
| PORT-02 | DEVE mostrar posições de investimentos por instituição e classe, distinguindo líquido/bruto, ausência de valor e cobertura incompleta |
| PORT-03 | DEVE permitir visualizar reservas identificadas na fonte e associar metas/nomes locais aos ativos existentes |
| PORT-04 | DEVE impedir dupla contagem entre saldo, investimento automático e cofrinho, com reconciliação auditável e indicação de sobreposição desconhecida |
| PORT-05 | DEVE manter origem, ID, moeda, data e qualidade de cada componente do consolidado; ativos sem valor não são saldo zero |
| PORT-06 | DEVE separar variação patrimonial de rentabilidade e não calcular retorno confiável só com diferença entre dois saldos |
| PORT-07 | DEVE suportar reserva local como alocação virtual de ativo existente, sem criar saldo adicional ou executar transferência |

## Vocabulário e composição

Saldo disponível, saldo total e limite de crédito não são intercambiáveis. Limite de cartão/cheque especial não entra como ativo. Investimento com valor de resgate desconhecido não é caixa disponível. Snapshot de ontem pode coexistir com saldo de hoje, mas a visão deve indicar defasagem por fonte e escopo.

Uma caixinha pode chegar como posição de investimento, reserva dentro da conta, conjunto de posições ou não chegar separada. Não inferir produto exato pelo nome de marketing. O campo reservado pode também representar bloqueio judicial: não converter toda reserva da fonte em cofrinho de meta.

Componentes canônicos devem ter relação explícita included_in/allocated_from quando uma fonte já incorpora outro valor. Uma reserva é uma visão/alocação, não um ativo extra. A relação precisa ser comprovada por contrato do campo e reconciliação do banco; nomes iguais não bastam.

Total de ativos BRL reconciliados = soma de componentes canônicos incluídos uma única vez. Valores de reservas alocados sobre esses componentes não são adicionados novamente. Onde a relação for desconhecida, mostrar subtotais separados e “Total parcial — sobreposição a conferir”, excluindo os componentes ambíguos da soma reconciliada. Não apresentar esse subtotal como patrimônio completo. Patrimônio líquido, passivos integrais e câmbio não são entregas iniciais.

Exemplo de regra proposta: conta total de R$ 1.000 já inclui reserva de R$ 200. Exibir conta R$ 1.000, reservado R$ 200 e livre R$ 800 somente se os campos da fonte comprovarem essa relação. Total de ativos continua R$ 1.000, e não R$ 1.200. Se a conta reportar apenas R$ 800 livres e um investimento distinto de R$ 200 fora dela, a soma poderá ser R$ 1.000 após reconciliação.

Meta local: título, valor-alvo, prazo opcional e alocações em ativos. Soma de alocações locais por ativo não ultrapassa o valor conhecido; validar concorrência transacional no repositório local, conforme T74. Não alocar novamente parte já reservada na fonte sem identificar que se trata da mesma reserva. Desvincular meta não resgata o investimento.

## Aceite

- AC-P01: conta R$ 1.000 incluindo caixinha de R$ 200 totaliza R$ 1.000; a seção Cofrinhos não aumenta o consolidado.
- AC-P02: investimento com valor null aparece sem valor disponível e deixa total parcial; não apresenta R$ 0,00.
- AC-P03: mesmo ativo em duas origens exige reconciliação; ambiguidade é visível, sem soma dupla.
- AC-P04: meta aloca R$ 100 de um ativo de R$ 150; segunda meta tenta R$ 100: impedir excesso, inclusive em duas gravações concorrentes.
- AC-P05: saldo cai R$ 100 após resgate; a tela não declara prejuízo de R$ 100 sem analisar fluxos.
- AC-P06: saldo reservado sem natureza conhecida fica “Reservado pela instituição”; não recebe rótulo de caixinha inferido.

## Contrato puro T24

Componentes canônicos carregam ID, moeda, centavos ou null, data da fonte ou null e natureza explícita: ativo, alocação ou limite. Ativos têm relação distinct/included/unknown; relação included precisa de pai comprovado na mesma moeda. Ciclos, IDs conflitantes e referências de inclusão inconsistentes falham; pai ausente, valores ausentes e sobreposição desconhecida produzem subtotal parcial. Alocações/limites nunca acrescentam patrimônio. Valores negativos de ativo ficam fora do subtotal de ativos e sinalizam parcialidade, sem apagá-los da origem ou convertê-los em zero. Datas diferentes são sinalizadas. Variação entre snapshots não recebe nome de rentabilidade, mesmo descontando fluxos.

## Recorte T31a — carteira demonstrativa

Separar contas, investimentos e reservas; filtrar instituição mantendo componente incluído junto de seu pai. Mostrar subtotal parcial calculado, fonte/data e valores ausentes. Reserva incluída aparece como detalhe e nunca ativo adicional. Não inferir liquidez/disponível/retorno se fonte não separar. Moeda BRL explícita no cenário; nenhum câmbio implícito. Valores seguem a preferência compartilhada de ocultação. T31b exige T27b, cobertura por instituição e homologação física; T32 mantém gestão de metas/alocações fora deste recorte.

## Recorte T15a — snapshots voláteis de ativos

Reusar guard principal/geração do ledger, sem disco/rede. Import ticket por conexão/produto (conta/investimento/reserva), com instituição enumerada e ownerSubject da entrada igual ao principal. Cada componente mantém moeda/asOf/null/relação; campos extras são descartados. Mesmo ID não troca conexão/produto silenciosamente; inclusão entre conexões é negada. Pai ainda não recebido deixa parcial até reconciliação.

Promover somente lote completo validado; ticket anterior no mesmo escopo é stale. Snapshot não autoritativo mescla itens e mantém subtotal parcial, sem apagar ausentes. Somente evidência explícita de snapshot autoritativo permite substituir todo o produto, inclusive vazio confirmado; remover pai não transforma filho órfão em dinheiro adicional. Informações faltantes de outros produtos/fontes continuam responsabilidade do controller, e sourceComplete é false por padrão. Não inferir rendimento, liquidez ou história. T15b exige runtime/persistência protegidos.

Guard T15a é verificação por operação. Controller privado futuro deverá fechar/purgar o store imediatamente ao bloquear; esta classe volátil não assina Auth por conta própria.

## Recorte T16a — metas/alocações voláteis

Metas têm título, moeda, alvo positivo em centavos e prazo civil opcional. Alocação é apenas associação local a raiz canônica distinta; nunca transferência, compra/resgate ou ativo extra. Orçamento por raiz traz revisão, valor alocável explícito, data e confirmação de que reservas da fonte já foram excluídas. Não inferir valor livre por diferença de campos sem prova. Raiz incluída/limite/ambígua é recusada como novo orçamento.

Aumentar alocação exige orçamento conhecido/data/confirmado, moeda igual e revisão corrente. Soma entre metas não excede valor alocável; operação síncrona valida candidato antes de trocar estado. Duas chamadas concorrentes em JS são serializadas; isso não prova transação SQLite da T16b. Atualização da fonte que reduza o orçamento não apaga associações: sinalizar excesso e permitir reduções/remoções, impedir aumentos. Desvincular/excluir meta não altera posições importadas.

Revisão de orçamento deve aumentar; mesma revisão divergente é conflito, data anterior é stale. Fonte desconhecida bloqueia aumento sem converter null em zero. Guard principal/geração e close iguais a T14a/T15a. Associação de meta a reserva já existente da fonte não consome novamente parte livre e será tratada na integração T32/T16b; este recorte aloca apenas valor não reservado comprovado. Sem persistência financeira real.
