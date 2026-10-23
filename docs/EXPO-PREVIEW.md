# Orbe — categorias e gastos reais no Expo Go

Publicado em 23/10/2026, iOS/SDK57, canal preview. Não depende do PC.

![QR de categorias e relatórios](assets/orbe-expo-go-categories-20261023.png)

Link direto: exp://u.expo.dev/update/01a169d0-96ee-74b4-9e34-0ea707c71e53

Update `01a169d0-96ee-74b4-9e34-0ea707c71e53` · grupo `bb54e026-b46f-47f3-a5b7-78fa6678a6a2` · commit `b7501ee2cf1564370f615846dfe1b9722d9df611`. Manifesto, scheme orbe, hash Hermes e QR oficial conferidos.

## Usar

- Na home: **Gastos por categoria e análises**.
- Em **Minhas movimentações**, mostre os valores e toque **Editar categoria e tipo**.
- Tipo **Gasto de consumo** entra no relatório; transferências/aplicações/faturas ficam separados. Sugestão de categoria é local e precisa ser escolhida.
- Relatório permite mês/moeda/banco, barras por categoria e detalhamento. Movimentos desconhecidos aparecem para revisão; cobertura parcial é explícita.
- Correções ficam apenas no cache criptografado deste iPhone, sobrevivem às atualizações e reabertura enquanto o cache existir. Logout, apagar cache, expiração ou remoção pelo iOS também apagam as correções.

## Validação e pendências

1276 verificações (1128 Node + 148 Python), tipos cliente/backend, exportação iOS/Hermes, auditoria1253 fontes/58 instâncias, scan privado/allowlist47, CI39995370769 aprovado. Nenhum dado financeiro real consultado por ferramentas. Backend/migrations inalterados.

Titular confirmou cache e Nubank funcionando em23/10. Edição/gráficos desta entrega e fluxo Connect novo ainda aguardam teste físico agrupado. [O que falta no produto](PRODUCT-STATUS.md).

## Versão anterior

Carteira automática: update01a169c1-09cf-7835-9041-7aaa0218c70b, QR orbe-expo-go-auto-20261023.png. Sua confirmação de cache/Nubank se refere a essa base, preservada na nova versão.
