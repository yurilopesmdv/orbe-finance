# SPEC-007 — Relatórios profundos com navegação simples

Estado: ready para R1 sintética; dados reais continuam bloqueados. Origem: pedido de UI/UX simples com profundidade de dados e relatórios, em 16/10/2026. Depende de SPEC-003/004/005/006. Relatórios são internos e determinísticos, sem enviar dados a IA, BI ou serviço de gráficos.

| ID | Requisito |
|---|---|
| RPT-01 | DEVE oferecer resumo legível e aprofundamento progressivo: cartão → relatório → movimentos/ativos que compõem o valor, preservando filtros |
| RPT-02 | DEVE permitir período/mês e filtros por instituição, conta, tipo e categoria, com dados detalhados e totais reconciliáveis |
| RPT-03 | DEVE mostrar despesas por categoria, receitas/despesas de consumo, transferências, aportes, resgates e estornos separadamente |
| RPT-04 | DEVE comparar períodos equivalentes com base e datas claras; divisão por zero, período incompleto e falta de histórico não geram porcentagem enganosa |
| RPT-05 | DEVE mostrar composição de contas/investimentos/reservas por banco/classe e evolução só a partir de snapshots existentes, sem inventar rentabilidade/histórico |
| RPT-06 | DEVE exibir completude, fontes, última atualização e regras de cálculo perto do resultado; total parcial continua parcial ao aprofundar |
| RPT-07 | DEVE manter gráficos/tabelas e cálculo dentro dos componentes aprovados, sem render remoto, exportação, links públicos ou compartilhamento no MVP |
| RPT-08 | DEVE permitir alternar gráfico e lista acessível, ocultar valores em todas as camadas e carregar detalhe sob demanda, sem depender de cores para explicar dados |

## Arquitetura de informação

Manter quatro áreas: Visão geral, Movimentações, Carteira e Ajustes. Relatórios é destino secundário da visão geral ou do contexto, sem nova barra cheia de opções. Tela inicial mostra poucos indicadores essenciais: ativos reconciliados, gastos do mês e cobertura/atualização. Botões claros: Ver gastos, Ver carteira e Ver relatório.

Um relatório começa com título e período, resumo curto e um gráfico/lista. Filtros avançados ficam em painel sob demanda; filtros ativos são visíveis. Tocar categoria abre as transações que explicam aquele valor. Tocar instituição/classe abre as posições, sem misturar cofrinhos já incluídos. Voltar preserva contexto.

Explicações financeiras curtas usam linguagem comum: “Transferência entre suas contas”, “Valor já incluído nos investimentos” e “Dados deste banco ainda não chegaram”. Fórmula/origem detalhada fica acessível em Como este valor foi calculado. Nunca esconder parcialidade no nível avançado.

## Relatórios do escopo inicial proposto

Gastos por categoria; fluxo mensal de consumo; comparação de meses; composição por banco e classe; evolução observada da carteira; progresso de metas locais. Compras de cartão detalhadas continuam dependentes da cobertura da spec de gastos. Sem histórico suficiente, relatório explica o limite em vez de extrapolar.

## Aceite

- AC-R01: categoria de R$ 80 em relatório abre a lista filtrada cujo total líquido é R$ 80 e preserva mês/banco ao voltar.
- AC-R02: período anterior zero mostra comparação em reais e percentual indisponível, não infinito; mês aberto fica identificado.
- AC-R03: caixinha de R$ 200 já incluída em R$ 1.000 de ativos não cria R$ 1.200 em gráfico de composição.
- AC-R04: falta um banco: visão geral, relatório e detalhe comunicam a mesma parcialidade; histórico inicia no primeiro snapshot válido.
- AC-R05: ocultar valores vale para títulos, gráfico, lista e leitor de tela; relatório não solicita domínios externos para gerar imagem/gráfico.
- AC-R06: leitor de tela consegue chegar de resumo a transações e voltar; filtros têm rótulos e não exigem memorizar uma legenda de cores.

## Recorte T57a — agregações locais puras

Relatório usa seleção canônica T27a sem paginação para agregados; página da lista não limita o total. Categoria inclui Sem categoria e usa exatamente o filtro da lista detalhada, incluindo vínculo de estorno fora do filtro. Soma dos líquidos por categoria deve fechar com líquido geral na mesma moeda. Parcialidade global acompanha cada aprofundamento.

Tipos financeiros são apresentados separadamente por entradas/saídas efetivadas e contagens pendentes/canceladas, sem somar duas pernas de transferência como consumo. Valores desconhecidos permanecem contagem de ausência e subtotal parcial. Fonte/moeda/período são explícitos; sem câmbio, previsão ou histórico inventado. T57b exige repositório privado/autorização T27b; a função pura não prova isolamento de usuário.

## Recorte T58a — relatório demonstrativo

Destino secundário /reports a partir da visão geral, sem quinta aba. Período/instituição da demonstração e categorias calculados por T57a; categoria abre /report-detail por IDs de filtros conhecidos, sem valores/descrições/tokens em URL. Detalhe usa T27a e retorna à mesma instância do relatório, preservando filtros. Parâmetros desconhecidos falham de forma explícita, sem ampliar consulta silenciosamente.

Mostrar fonte/data/base de conta sem cartão, fórmula e tipos separados; cada valor segue ocultação compartilhada. Lista textual acessível inicial, sem dependência de cor, imagem remota/exportação. T58b/T61 ainda exigem repositório privado e validação física; T59/T60 continuam filtros avançados/comparações e não ficam marcados completos por esta demonstração.

## RPT-09 — Filtros avançados com contexto (T59a)

Na demo, relatório DEVE combinar instituição/conta/tipo/categoria/mês, com resumo de filtros sempre visível mesmo com painel fechado. Contas listadas são somente exemplos conhecidos e compatíveis com a instituição; mudar instituição limpa conta incompatível. Detalhe da categoria preserva conta/tipo/período/instituição, sem valores ou dados livres em rota. Parâmetro desconhecido/array/conta de outra instituição não pode ampliar consulta silenciosamente. Limpar filtros preserva mês; voltar mantém contexto da pilha. Movimentações oferece o mesmo filtro por conta e contexto visível. Nenhuma rede/persistência privada nova.

Quando a categoria já está filtrada no relatório, o drill-down carrega também o escopo original de categoria, validado contra a categoria do detalhe, para recomputar a mesma parcialidade sem confiar em booleano fornecido pela rota.

## RPT-10 — Comparação mensal honesta (T60a)

Comparação DEVE usar observações de dois meses consecutivos da mesma moeda, com centavos inteiros, cobertura e data de observação explícitas. Ausência é null, não zero. Diferença observada pode aparecer para subtotais conhecidos, mantendo parcialidade. Percentual somente quando ambos os meses têm cobertura completa e já estavam encerrados na data da observação em Brasília; negar base<=0, consumo atual negativo, data desconhecida e valores fora da faixa segura. Calcular diferença/razão com BigInt, arredondando percentual a duas casas (basis points, meio para longe de zero), sem rentabilidade/extrapolação. Projeção retorna só campos canônicos, sem extras do objeto de entrada. T60a não cria histórico nem tela; composição/evolução patrimonial continuam T60c.

## RPT-11 — Comparação na demo (T60b)

Relatórios DEVE abrir comparação com os mesmos filtros e voltar preservando contexto. Setembro2026 é definido explicitamente como cenário vazio conhecido; outubro2026 é observação parcial em19/10; agosto ou mês sem fixture permanece ausente, sem saldo inventado. Valores da comparação derivam da seleção local completa, nunca de histórico gerado. Diferença e percentual usam ocultação visual/acessível compartilhada; motivos não contêm valores. Rota aceita somente filtros conhecidos, sem texto livre/valores. Não é evolução de patrimônio nem rentabilidade.
