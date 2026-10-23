# T77 — Home financeira (integrador único)

Spec: specs/010-financial-home/spec.md. Etapas sequenciais, sem esperar nova aprovação.

1. T77a: migration19, lease por produto/protocolo compatível, testesSQL/RLS e transportes. Paths migrations/_shared/lease*/runtime/network, src/features/sync/*transport, read-batch, scripts/financial-release(expected19).
2. T77b: hub eprovider privados com runtimes existentes, fila única/auto/timer/purge. Paths src/features/finance e_layout; testes injetados.
3. T77c: account home consolidada, detalhes usandohub, progresso/valores/últimos5/carteira sem dupla contagem, badges corrigidos. Paths account/my-accounts/my-movements/my-investments/components/ui; testes projeção.
4. T77d: check/export/audit/scans/CI; aplicar19+fixture; disable/deploy/enable fontes/digests/smokes; publicarExpo/manifesto/QR; guias/STATE/Git.

Checkpoint obrigatório por etapa. Não parar no plano/patchlocal. Nenhum dado real em tools. Bradesco semproxy e reservas semprova continuam limitações explícitas, sem fabricar cobertura.
