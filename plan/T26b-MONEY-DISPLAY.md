# T26b — Precisão na apresentação de dinheiro

Estado: done. 19/10/2026. EXP-05/UX-02/RPT-08. Responsável sequencial. Paths src/components/money-label.ts/privacy.tsx, tests/presentation e checkpoints.

Bug reproduzido: Intl.format(MAX_SAFE_INTEGER/100) mostra final ,90; valor canônico é ,91. Separar unidades/centavos por BigInt, formatar unidade inteira segura via Intl.formatToParts e substituir fraction por dois dígitos exatos. Suportar sinal negativo abaixo de uma unidade, moeda explícita e zero. Label compartilhado mantém ocultação e ausência sem vazamento por acessibilidade.

Aceite: extremos seguros, centavos pequenos, negativos, moeda e invalid/oculto/null; TypeScript/suíte e bundle iOS. Sem layout/novo pacote.

## Evidência

TypeScript/195 testes e bundle Hermes iOS passaram. Seis testes novos cobrem extremos seguros, centavos negativos, zero/valores ordinários, moeda, entrada inválida e label de ocultação/ausência. MAX_SAFE_INTEGER agora termina em ,91. Layout preservado; texto/acessibilidade usam o mesmo label.
