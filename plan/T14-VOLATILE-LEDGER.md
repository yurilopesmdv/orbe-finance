# T14 — Repositório de movimentos e classificação

T14a done; T14b persistente/integração privada pendente. 19/10/2026. EXP-02/04. Responsável sequencial. T14a usa T13/T07 e domínios T25/T26/seleção T27a já concluídos, sem ciclo com T27b. Paths src/data/local/ledger.ts, tests/data/ledger.test.mjs e checkpoints.

Implementar guard principal/geração, import ticket completo/escopado com promoção atômica e preservação da versão anterior, catálogo/rules/overrides separados. Descartar campos extras e retornar cópias. Não gravar dados financeiros ou simular Auth validado; guard é port sintético a integrar na T14b.

Aceite: outra identidade/geração não lê totais; lote parcial/conflitante/stale não promove; revisão sobrevive à nova fonte; arquivo histórico preservado; aliases/referências não permitem mutação externa; close purga e bloqueia. TypeScript/suíte pura, sem ambiente remoto necessário. Persistência criptografada real depende de runtime e testes de sessão/backup/restore.

## Evidência T14a

TypeScript e179 testes passaram, incluindo14 cenários novos: principal/geração/bloqueio, owner divergente, lote parcial/conflitante/stale, escopo, override preservado, histórico arquivado, Sem categoria, cópias/projeção e moedas. Identidade em outro período é conflito até reconciliação explícita T22. Repositório é somente memória, não importado pelo app privado ainda e não prova persistência/backup/SQLCipher. T14b permanece pendente.
