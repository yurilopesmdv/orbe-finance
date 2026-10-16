# T04 — Contrato financeiro e catálogo sintético

Estado: done, 16/10/2026. Requisitos EXP-02/05, PORT-04. Paths: SPEC-003/004, tests/fixtures/financial-cases.json, esta evidência e checkpoint. Dependência T01 cumprida; sem código do cálculo T26 nesta task.

## Representação e invariantes

- Valores BRL: centavos inteiros seguros; decimal entra como string canônica com ponto e no máximo duas casas. Rejeitar overflow de entrada e soma, expoente, separador local e precisão extra. Formatação pt-BR somente na apresentação.
- Magnitude do movimento não negativa; direção crédito/débito e tipo separados. Null é ausente; zero é valor conhecido. Sem misturar moeda estrangeira ou usar taxa implícita.
- Quantidade/taxa de investimento permanecem strings decimais até selecionar biblioteca mantida na implementação; não converter quantidade em centavos.
- Data civil conserva calendário. Timestamp precisa offset explícito, agrupado em Brasília. Rejeitar data impossível; DST/fuso é decisão por fonte, não deslocar data civil pela timezone do aparelho.
- Despesas: efetivadas, tipo despesa; pendentes/canceladas excluídas. Estorno vinculado ajusta seu próprio mês, mesmo tornando gasto líquido negativo quando compra foi de mês anterior. Mostrar bruto/estorno/líquido separadamente.
- Transferência própria só com vínculo confiável; Pix isolado não é prova. Pagamento de fatura vira liquidação quando compras estão cobertas, sem duplicar. Fonte parcial deve informar base do relatório.
- IDs estáveis de fonte/conta/movimento deduplicam. Correções do usuário são separadas da origem. Repetir lote preserva classificação; não apagar movimento só por faltar em página incremental.
- Cofrinhos: included_in comprovado não adiciona ativo; allocated_from é organização virtual. Ciclos/duplicação/ambiguidade impedem total completo. Null/ambiguidade não recebem zero.
- Limite de alocação é validado atomicamente no repositório local, conforme T74; não exigir servidor financeiro para isso.

## Casos de referência

Catálogo JSON contém 14 cenários M01–M14: soma decimal exata, despesa/estorno, transferência, cofrinho incluído, null, data civil, instante na fronteira do mês, estorno intermensal, fatura, entrada inválida/overflow, sobreposição desconhecida, pendência, repetição e moeda separada. Números e IDs são inventados; não representam finanças do titular.

Saída esperada escrita antes da implementação do domínio. JSON validado por parser; esse check não executa nem valida os cálculos futuros. T26/T24 devem consumir casos e adicionar teste comportamental da implementação. Próxima task T05: wireframes estáticos de cinco fluxos com estados e privacidade.
