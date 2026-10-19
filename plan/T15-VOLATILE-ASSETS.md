# T15 — Posições e relações locais

T15a done; T15b privado/persistente pendente. 19/10/2026. PORT-02/03/04. Responsável sequencial. T13/T24/T14a concluídas. Paths src/data/local/scope.ts/assets.ts/ledger.ts, testes e checkpoints.

Extrair guard de memória compartilhado preservando testes do ledger. Snapshots por conexão/produto com validação completa antes de troca; inclusão validada no conjunto, dado desconhecido parcial, campo extra descartado. Snapshot autoritativo só por parâmetro explícito confirmado pelo adaptador futuro. sourceComplete defaultfalse; não inventar histórico/rendimento ou persistência real.

Aceite: atualização parcial/stale/conflitante não corrompe versão; conta+reserva somadas uma vez; pai ausente/currency/null explícitos; referências entre conexões negadas; principal alterado/close purgam acesso; vazio autoritativo difere de ausência não comprovada. TypeScript/suíte pura sem banco real.

## Evidência T15a

TypeScript/189 testes passaram, incluindo10 snapshots novos e todos os14 cenários do ledger após extração do guard compartilhado. Pai/reserva, snapshot parcial/stale/conflitante/cíclico, vazio autoritativo, referências cruzadas, moeda/null/cópias e principal diferente cobertos. Não há persistência ou assinatura automática do Auth; integração privada deverá close imediatamente ao lock. T15b permanece pendente.
