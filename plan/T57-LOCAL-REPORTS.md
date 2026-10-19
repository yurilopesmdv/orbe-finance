# T57 — Consultas dos relatórios

T57a done; T57b pendente. 19/10/2026. RPT-02/03/06. Responsável sequencial. Dependências T24/T26/T27a; T27b permanece para integração privada. Paths src/data/local/query.ts, src/data/local/reports.ts, tests/domain/reports.test.mjs e checkpoints.

Extrair seleção completa compartilhada com paginação, sem duplicar filtro. Agrupar categorias com cálculo idêntico ao detalhe; tipos por direção/estado sem consumir transferência/fatura. Nenhuma rede/persistência/render remoto. Validar paginação>100, soma por categoria, detalhe, estados, transferência, ausência e moeda. TypeScript/suíte; não precisa novo bundle enquanto função não importada pela UI.

## Evidência T57a

TypeScript e137 testes passaram, sendo8 casos novos de relatórios. Agregado fecha com cada detalhe/categoria e não se limita à página (201 movimentos testados). Transferência entrada/saída é separada, estados/ausências/moedas preservados. Seleção completa compartilhada mantém paginação da lista e resumos no mesmo contrato. Nada de rede ou persistência. T57b continua pendente.
