# T26 — Cálculos financeiros puros

Estado: done com testes sintéticos. Requisitos EXP-05/06/07 e contrato T04. Dependência T04, ajustada antes de código; ingestão fica separada e ainda não homologada. Paths src/domain/money.ts, src/domain/expenses.ts, tests/domain/expenses.test.mjs, package.json, SPEC-003 e checkpoint.

Dinheiro decimal canônico → centavos inteiros com BigInt apenas na conversão/soma segura; magnitudes de movimento não negativas. Datas civis preservadas, instantes agrupados em Brasília. Total bruto/estornos/líquido e parcialidade separados, sem parear transferência por semelhança ou confundir fatura com compra. Duplicatas exatas deduplicadas, conflitos não escolhidos silenciosamente.

Casos de referência T04 devem orientar testes; nenhum registro bancário real. Funções não dependem de React, Expo, rede, Auth ou SQLite. Texto de erro é código genérico, sem conteúdo financeiro.

## Evidência

Typecheck passou;18 testes do domínio passaram, além de20 de acesso e9 de audit (47 total). Casos monetários T04 M01/02/03/06/07/08/09/10/12/13/14 cobertos; carteira M04/05/11 segue T24. Importações .ts explícitas usam allowImportingTsExtensions/noEmit para compartilhar TS entre Metro e testes Node22 sem transpilador extra. Não há banco ou rede no domínio. Integração com fonte/cartão real ainda pendente; tipos são contratos canônicos, não inferência de lançamento real. Próxima T24.
