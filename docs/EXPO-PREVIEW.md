# Orbe — Expo Go SDK 58

Publicado em 25/10/2026, iOS/SDK58, canal preview. Não depende do PC. Abra com Expo Go compatível com SDK 58; o QR antigo continua vinculado ao update SDK 57.

![QR Orbe SDK 58](assets/orbe-expo-go-sdk58-20261025.png)

Link direto: exp://u.expo.dev/update/01a17395-765d-7e9c-becd-313c819b8c43

Update `01a17395-765d-7e9c-becd-313c819b8c43` · grupo `62dfde81-9c15-42af-b2fd-b67db06f5688` · commit `8b838719fac0f86aee15222e16aae28cd90d6f2c`. Manifesto SDK58, scheme orbe, hash do download Hermes e link oficial do QR conferidos.

## Usar

- Na home: **Gastos por categoria e análises**.
- Em **Minhas movimentações**, mostre os valores e toque **Editar categoria e tipo**.
- Tipo **Gasto de consumo** entra no relatório; transferências/aplicações/faturas ficam separados. Sugestão de categoria é local e precisa ser escolhida.
- Relatório permite mês/moeda/banco, barras por categoria e detalhamento. Movimentos desconhecidos aparecem para revisão; cobertura parcial é explícita.
- Correções ficam apenas no cache criptografado deste iPhone, sobrevivem às atualizações e reabertura enquanto o cache existir. Logout, apagar cache, expiração ou remoção pelo iOS também apagam as correções.

## Validação e pendências

1281 verificações (1133 Node + 148 Python), tipos cliente/backend, exportação iOS/Hermes, auditoria1299 fontes/50 instâncias, scan privado/allowlist47, CI40204815440 aprovado. Revisão de dependências e limites em [SDK58](security/EXPO-SDK58-REVIEW-20261025.md). Nenhum dado financeiro real consultado por ferramentas. Backend/migrations inalterados.

Titular confirmou cache e Nubank funcionando em23/10. Edição/gráficos desta entrega e fluxo Connect novo ainda aguardam teste físico agrupado. [O que falta no produto](PRODUCT-STATUS.md).

## Versões anteriores (SDK 57)

Categorias T82: update01a169d0-96ee-74b4-9e34-0ea707c71e53, QR orbe-expo-go-categories-20261023.png.

Carteira automática: update01a169c1-09cf-7835-9041-7aaa0218c70b, QR orbe-expo-go-auto-20261023.png. Sua confirmação de cache/Nubank se refere a essa base, preservada na nova versão.
