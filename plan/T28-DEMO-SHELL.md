# T28 — Shell demonstrativo

Estado: done, 19/10/2026. UX-01/03/04. Responsável: implementação sequencial. Paths src/app, src/components, SPEC-005 e checkpoints.

Criar quatro abas reais com navegação Expo Router; preservar welcome com entrada explícita em demonstração. Componentes para layout, cartões e sete estados distintos, com mensagem e ação coerentes. Conteúdo inicial explica ausência de bancos; não inventa saldo. Galeria em Ajustes é demonstrativa e não aciona serviços. Sem novas dependências ou imagens externas.

Aceite: rótulo permanente, tab labels, safe areas, fonte escalável, alvos >=44, contraste e sem altura fixa em textos. Typecheck/suíte e exportação iOS. Homologação visual/acessibilidade física permanece pendente.

## Evidência

TypeScript, 84 testes e exportação Hermes iOS passaram (bundle de 2,4 MB). Quatro abas e welcome compilados; sete estados disponíveis na galeria demonstrativa de Ajustes. Sem novo pacote. Inspeção visual, VoiceOver e gestos no iPhone permanecem T38/T45, sem alegar homologação física.
