# T16 — Metas e alocações

T16a done; T16b transação privada/persistência pendente. 19/10/2026. PORT-07. Responsável sequencial. T15a/T24 concluídas. Paths src/data/local/goals.ts, tests/data/goals.test.mjs e checkpoints.

Usar MemoryScope, alvos/valores em centavos seguros e orçamento explícito de raiz distinta, com reservas da fonte já excluídas. Sem heurística de disponibilidade/caixinha. Validar candidato inteiro antes de atribuir; moedas/versões/qualidade guardadas. Redução de fonte preserva histórico e marca excesso, permitindo correção sem resgate. Virtual components têm kind allocation e não aumentam carteira.

Aceite: duas metas não excedem orçamento em Promise.all; parcial/null/stale/moeda incompatível negados; sobre-alocação após fonte cair é visível e corrigível; exclusão só remove associação; guard/clone protegem contexto. TypeScript/suíte. Não alegar concorrência de banco nativo, efeitos bancários ou persistência.

## Evidência T16a

TypeScript/207 testes passaram, incluindo12 cenários de metas/alocações. Promise.all com duas metas permite apenas associação dentro do orçamento; source reserve/virtual component não aumenta carteira; null/reserva desconhecida/stale/moeda/revisão/overflow negados. Fonte reduzida preserva associação com excesso sinalizado e permite redução. Excluir meta não altera raiz. Apenas memória e concorrência JS; T16b nativo/privado pendente.
