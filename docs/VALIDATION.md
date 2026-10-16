# Validação planejada e rastreabilidade

Estado: desenho de testes, **não testes executados**. Não há código nesta etapa. Cada task técnica, após autorização, deve adicionar evidência real, ambiente, data, resultado e limites; não substituir esta matriz por afirmações genéricas de funcionamento.

| Cenário | Requisitos rastreados | Tasks | Prova futura esperada |
|---|---|---|---|
| V01 Escopo e independência | PRD-04, PRD-07 | T01, T07, T08 | Expo Go iPhone validado e destino cloud próprio, sem tocar F1 |
| V02 Custo e conexões | PRD-01, PRD-05, OF-01, OF-09 | T03, T19, T33, T39–T42 | Modo pessoal elegível, quatro fichas e ausência de chamadas proibidas/cobrança implícita |
| V03 Login/recuperação/logout | AUTH-01, AUTH-03, AUTH-06 | T02, T10, T11 | Senha válida/inválida, limitação, recovery expirado, offline e logout |
| V04 Bloqueio e biometria | AUTH-04, AUTH-05, AUTH-07, PRD-08 | T12, T38, T46 | Sem flash financeiro ao retomar; nenhuma biometria fictícia em Expo Go; build futuro exige teste físico |
| V05 Autorização e ownership | AUTH-02, OF-02, OF-07 | T13–T18, T27, T34, T35 | Testes negativos de cada tabela/endpoint e relações cruzadas, sem segredo no bundle |
| V06 Revogar/apagar | AUTH-08, OF-03, OF-08 | T19, T33, T37, T43 | Corrida com worker/evento atrasado, pausa, renovação e purge sem recriação |
| V07 Sincronização durável | OF-04, OF-05 | T20–T23, T35, T36 | App fechado, lease expirado, repetição, paginação, ordenação invertida e retomada |
| V08 Falha e qualidade | OF-06, PORT-05, UX-03 | T21, T23, T27, T29, T43 | Timeout/429/página 2/valor null e produto parcial sem zeros ou sucesso falso |
| V09 Categorias | PRD-03, EXP-01, EXP-03, EXP-04 | T14, T25, T30 | Filtros fecham com total e override sobrevive a reimportação; categoria alheia negada |
| V10 Cálculo e estados | EXP-02, EXP-05 | T04, T22, T26 | Centavos exatos, cancelado/pendente, fronteira de mês/fuso e estorno intermensal |
| V11 Transferências/cartões | EXP-06, EXP-07 | T26, T40, T43 | Pix próprio confirmado versus terceiro e compra/fatura sem duplicidade |
| V12 Carteira | PRD-02, PORT-01, PORT-02 | T23, T27, T31 | Conta/limite/resgate/bruto/líquido/moeda e datas distinguidos |
| V13 Reservas | PORT-03, PORT-04 | T15, T24, T32, T39, T41 | Exemplo conta 1.000/caixinha 200 = total 1.000; representação desconhecida fica parcial |
| V14 Metas locais | PORT-07 | T16, T32 | Alocação concorrente não excede ativo, sem criar saldo nem transferência |
| V15 Variação e retorno | PORT-06 | T24, T31 | Aporte/resgate não interpretados como rentabilidade; valor sem cotação não vira zero |
| V16 Fluxos e acessibilidade | UX-01, UX-02, UX-04, UX-05 | T05, T28–T33, T38 | Safe area, texto dinâmico, leitor de tela, ocultar valores, datas e retorno externo seguro |
| V17 Entrega e continuidade | PRD-06 | T06, T09, T44, T45 | Spec/task/commit/evidência relacionados; CI antes de deploy, checkpoint reproduzível |

## Níveis de evidência

1. Domínio puro: fixtures sintéticas versionadas para dinheiro, categorias, mês, reservas e transferências.
2. Banco isolado: migrations/constraints/RLS com proprietário, segunda identidade e anônimo; nenhum teste usa contas reais por padrão.
3. Adaptador/HTTP: respostas sintéticas, timeout/429/erro parcial, retry/idempotência e controle de quotas.
4. Fluxo de UI: navegação e estados em ambiente sintético; identificação clara de dados demonstrativos.
5. iPhone físico: background/reentrada, teclado, safe areas, bloqueio, retorno de portal e leitor de tela. Compilar bundle não prova comportamento em aparelho.
6. Integração real: consentimento do próprio titular e banco por banco, com comparação privada, evidência sanitizada e limpeza dos dados de teste quando apropriada.

## Release e riscos

R1 exige evidência de acesso/segurança/domínio, não conexão bancária. R2 exige também quatro fichas e visão conjunta com fonte/data/completude; se um produto faltar, limitação explícita e aceite de escopo reduzido antes de declarar conclusão. R3 não é aprovada por simular resultado biométrico.

Antes de dados reais, validar logs/segredos/retencão, comportamento de exclusão, quotas, backup/restore e superfície de endpoints. Esses são critérios do produto financeiro planejado, não alegação de auditoria completa. Não usar conta real de terceiro para provar RLS. Evidência pública deve conter apenas cenários sintéticos e IDs de testes sem identificação financeira.
