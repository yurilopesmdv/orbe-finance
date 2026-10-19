# T19a — Estados e capacidade de leitura

Estado: done. OF-01/03/08/09/11, MPG-02/06. Depende T13/T18a/b1. Integrador único. Paths: spec002, este plano, src/domain/connections.ts, tests/domain/connections.test.mjs, package.json, docs/security/BRIDGE-CORE.md, roadmap/STATE.md/ROADMAP.md, tasks/TASKS.md, AGENTS.md, README.md.

Fatia pura, nenhuma API ou UI nova. Entrada unknown é DTO camelCase da ponte, jamais payload bruto do fornecedor. Política confiável integrationEnabled/privateDataApproved exige true; antes disso retorna disabled sem ler raw ou now. Depois validar now inteiro e metadata (UUID/revisão/enum/timestamps), capabilities ausentes→null, malformadas rejeitadas. Evidência/source/lastread não podem estar no futuro além de60s de skew; expiração é futuro esperado, ausente permanece null. Datas normalizadas UTC.

Active sem evidência OF vira unsupported e não permite leitura; active expirado vira renewal_required. Preservar paused/revoked/pending/error. Active com produtos incompletos mostra partial, mas só true é legível; todosfalse→unsupported, todosnull→partial sem leitura. ReadableProducts congelado, sem saldo/owner/item/extras. Ausência de expiração não prova autorização corrente: adapter deve revalidar a fonte em T19b/T18c; modelo é política interna, não recebe flags do HTTP.

Aceite: gateszeroacesso, capacidadesfalse/null distintas, estadosbloqueados, expiraçãoexata/futuro/evidência nula, schema/timestamps/PII/projeção/imutabilidade. TypeScript cliente/ponte/suíte; export desnecessário sem UI/import cliente. T19b mapeia fonte pessoal comprovada após contratos/gates. T20 quotas é próxima independente, sem chamadas bancárias.

## Evidência

TypeScript cliente/ponte e332 testes passaram,12novos. Gates validam zero acesso, capacidades e propriedades herdadas nunca ampliam leitura, output congelado/sem extras. Sem UI/rede, export desnecessário. Próxima T20a quotas/lease/fencing em metadata server-side; provider T19b continua pendente.
