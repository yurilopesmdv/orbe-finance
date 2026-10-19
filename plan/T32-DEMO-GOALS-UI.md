# T32 — Metas locais na interface

T32a done; T32b privado/persistente pendente. 19/10/2026. PORT-03/07. Responsável sequencial. T16a/T24/T31a concluídas. Paths src/app/goals.tsx, portfolio, src/data/demo/goals.ts/store.tsx, helper de formulário, goals.ts e testes/checkpoints.

Seed inteiramente inventado e DemoProvider com reset/refresh; sem chamadas remotas/persistência. Formulário BRL/prazo, criar/alocar/desvincular/excluir e mostrar alvo/associação/orçamento. Sem incluir alocação no patrimônio ou chamá-la de saldo bancário. Reusar Money/ocultação e limpar campos ao background. Confirmação de exclusão é produto, não pausa de implementação.

Integração corrige guarda de soma por meta: candidate pode conter várias raízes; overflow deve falhar antes da troca. Testar parse, seed, reset, invariância patrimonial e overflow. TypeScript/suíte/bundle iOS; interação/VoiceOver físicos pendentes.

## Evidência T32a

TypeScript/212 testes e bundle Hermes iOS passaram. Seed/formulário BRL/prazo/reset e patrimônio invariável cobertos; novo caso de soma entre raízes impede overflow antes da promoção. Interface compartilha DemoProvider, limpa campos em background, mascara título livre quando oculto e anuncia erro sanitizado no contexto da meta. PAT/UUID privado ausentes nos artefatos. Interação/VoiceOver/confirm dialog físicos permanecem finais; T32b privado pendente.
