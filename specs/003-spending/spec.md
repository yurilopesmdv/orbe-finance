# SPEC-003 — Gastos, tipos e categorias

Estado: ready para R1 sintética; dados reais continuam bloqueados. Depende de SPEC-000/002. A classificação do Orbe é separada dos dados importados, para que a próxima sincronização não apague a escolha do usuário.

| ID | Requisito |
|---|---|
| EXP-01 | DEVE mostrar transações por período, banco, conta, tipo e categoria, com pesquisa e paginação |
| EXP-02 | DEVE distinguir receita, despesa, transferência própria, aporte, resgate, rendimento, estorno e desconhecido; direção crédito/débito é campo separado |
| EXP-03 | DEVE oferecer categorias iniciais e personalizadas, opção Sem categoria e exclusão/arquivamento sem perder histórico |
| EXP-04 | DEVE preservar correção manual acima de regras do usuário, categoria de provedor e fallback; automatismo nunca sobrescreve override |
| EXP-05 | DEVE calcular despesas mensais apenas com movimentos efetivados classificados como despesa e ajustar estornos vinculados sem duplicidade |
| EXP-06 | DEVE identificar possíveis transferências próprias sem assumir que todo Pix é transferência; confirmação/correção fica disponível |
| EXP-07 | DEVE separar compras de cartão do pagamento da fatura e explicar a base do relatório quando houver cobertura parcial |

Categorias iniciais propostas: moradia, alimentação, transporte, saúde, educação, lazer, assinaturas, impostos/taxas, compras e outros. Tipos são fatos financeiros; categorias são organização do consumo. Uma transferência não vira consumo só por receber categoria Alimentação. Regras determinísticas iniciais por descrição normalizada, conta e direção; nenhuma chamada a IA ou enriquecimento pago é necessária.

## Regras de cálculo e integridade

- Data para o mês: data de efetivação fornecida; datas puras não sofrem deslocamento por fuso. Instantes são UTC e apresentados em America/Sao_Paulo.
- Valores monetários em centavos inteiros por moeda; quantidades e taxas usam decimal. Não usar ponto flutuante binário para somar dinheiro. Valores ausentes ficam null.
- Débito/crédito é normalizado no adaptador e não inferido apenas do sinal. Guardar valor de origem e convenção usada para auditoria restrita.
- Despesa líquida = despesas efetivadas do período − estornos efetivados vinculados no período. Cancelada excluída; pendente aparece em seção separada. Estorno de compra de outro mês ajusta o mês de efetivação do estorno, mantendo vínculo ao original.
- Transferências próprias, aportes e resgates não entram como gasto/receita de consumo. Rendimento aparece separado; não misturar com salário sem escolha explícita.
- Pareamento automático de transferências somente com identificador confiável entre contas do mesmo titular. Coincidência de valor/data/descrição gera sugestão; não altera total silenciosamente.
- Mesma transação em conexão antiga/nova exige reconciliação por identificador estável; heurística de semelhança não apaga movimentos automaticamente.
- Se cartão ainda não estiver integrado, identificar relatório como movimentações de conta e pagamento de fatura como saída não detalhada, sem afirmar gasto por categoria completo. Ao integrar compras, pagamento da fatura passa a liquidação e não nova despesa; histórico requer recomposição versionada.

## Aceite

- AC-E01: compra de R$ 100 e estorno vinculado de R$ 20 no mesmo mês resultam em R$ 80; repetição do evento não altera isso.
- AC-E02: R$ 500 entre contas próprias não vira R$ 500 de receita e despesa; Pix a terceiro continua candidato a despesa.
- AC-E03: alteração manual para Saúde permanece após sincronização e mudança de categoria do provedor.
- AC-E04: R$ 0,10 + R$ 0,20 totalizam R$ 0,30; moeda estrangeira permanece fora do total BRL.
- AC-E05: compra de cartão R$ 200 + pagamento de fatura R$ 200 não geram R$ 400 de gasto.
- AC-E06: data 2026-10-01 permanece em outubro, inclusive em dispositivo de outro fuso; pendências/cancelamentos são distinguíveis.
- AC-E07: resumo por categoria fecha com lista detalhada para os mesmos filtros e versão de classificação; Sem categoria não some do total.

## Contrato monetário T04

BRL em centavos inteiros seguros (Number.isSafeInteger), entrada monetária decimal como string, sem parseFloat/arredondamento silencioso. Rejeitar casas além de duas, notação exponencial, NaN/infinito e overflow; null continua ausência, diferente de zero. Valor de movimento é magnitude não negativa; direção é campo obrigatório separado. Soma também precisa permanecer inteira segura. Moedas distintas não são somadas. Data civil estrita YYYY-MM-DD mantém o mês; timestamp exige offset/Z e é agrupado em America/Sao_Paulo. Identidade de lote é (fonte, conta, ID externo), nunca só descrição/data/valor. Contrato detalhado e casos em T04.

## Interface pura T26

Entradas canônicas incluem fonte/conta/ID externo, magnitude em centavos, moeda, direção, tipo, estado e data. Mesmo ID com conteúdo financeiro divergente é conflito, não atualização decidida pela ordem da lista; ingestão deve resolver versão antes do domínio. Estorno só reduz gasto se referência ao original efetivado de despesa puder ser confirmada no conjunto fornecido, inclusive fora do mês filtrado. Caso contrário, marcar parcial e preservar item para revisão. Tipos desconhecidos ou valores ausentes tornam a análise parcial. Pagamento de fatura classificado como liquidação não é nova despesa; relatório deve indicar sua base de cobertura.

## Interface pura T25 — classificação

Classificar categoria e tipo separadamente, preservando origem de cada campo: override explícito > primeira regra aplicável > provedor > fallback. Override null de categoria significa Sem categoria e bloqueia fallback; propriedade ausente significa sem override. Tipo fallback é unknown. Catálogo deve ser previamente autorizado pela camada de dados; domínio não substitui isolamento/RLS. IDs duplicados são rejeitados.

Categoria arquivada permanece em override histórico; regras/provedor só podem atribuir categorias ativas. Categoria removida vira Sem categoria e exige revisão, sem descartar movimento. Regra usa trecho literal normalizado (acentos/maiúsculas/espaços), conta/direção opcionais, prioridade numérica menor primeiro e ID como desempate estável; campos ausentes não sobrescrevem outro campo. Nada de regex, IA ou rede. Regras não podem atribuir transferência própria automaticamente; provedor só pode fazê-lo com vínculo confiável entre contas próprias. Sem confirmação, tipo unknown e revisão necessária. Override explícito pode confirmar transferência própria.

## Consulta local T27a

Lote previamente autorizado, canônico e classificado em memória; esta função não autentica nem busca dados. Validar duplicatas/conflitos antes de filtrar. Filtros por mês, conta, instituição, tipo, categoria (null = Sem categoria) e trecho de descrição. Ordenação por data civil/instante em Brasília desc e identidade estável no empate; página não muda resumo do conjunto completo filtrado. Originais necessários à validação de estornos ficam disponíveis ao cálculo mesmo fora da página/mês, mas não são exibidos como resultados extras. Moeda explícita, parcialidade da fonte preservada, nenhum movimento financeiro persistido pela consulta.

Cálculo de despesas pode receber evidências de originais separadas dos movimentos selecionados: originais validam vínculo de estorno, mas nunca entram no total por estarem apenas no conjunto de evidência. Não alterar datas ou conteúdo para excluir um original do total.
