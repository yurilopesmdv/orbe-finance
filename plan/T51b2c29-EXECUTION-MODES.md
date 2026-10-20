# T51b2c29 — Modos explícitos da infraestrutura preparada

MPG-44/ADR-016. Integrador único. Depende MPG-43. Paths: execution-mode.ts e móduloslowlevel de contas/inventário/router, tests/bridge/execution-mode.test.mjs, package/spec/ADR/TASKS/STATE. Bootalto/entrypointnãoativados.

1. Definir política comum fixture/live/defaultoff/conflito/aprovaçãoindependente.
2. Adaptar validação lowlevel e propagar modo internamente, preservando APIs/testes fixture antigos.
3. Testar modo/gates e pipeline com dados fictícios; regressões completas.
4. Checkpoint; próxima c30 habilitar composição de boot explicitamente live e rede literal, mas manter flags/entrypoint publicadosoff.
