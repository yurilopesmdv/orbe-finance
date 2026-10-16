# T07 — Bootstrap Expo SDK57

Estado: review — implementação e checks concluídos; smoke físico pendente, 16/10/2026. PRD-04/07, dependência T06 concluída. Paths: package.json/package-lock.json, .nvmrc/.gitignore, app.config.ts/tsconfig.json/expo-env.d.ts, src/app/*, src/config/runtime.ts, esta evidência e checkpoints. Sem backend, banco ou credenciais.

Registry npm consultado antes de instalar: Expo57.0.30 e template oficial expo-template-default57.0.32. React19.2.3/RN0.86.3 e versões compatíveis extraídas do package.json do tarball oficial, sem executar o template. Estrutura mínima escrita no repo, preservando documentação e histórico.

Primeira tela apenas identifica o ambiente demonstrativo e limites; não mostra finanças reais nem promete login/bancos funcionais. Configuração sintética fixa, sem chave, .env ou API. Expo Go no iPhone exige Metro em LAN e teste do titular; bundle/check automatizado não substitui smoke físico.

## Evidências executadas

- npm install --ignore-scripts: lockfile criado, scripts de terceiros não executados.
- npm run check: TypeScript passou e 20 cenários de acesso passaram com execução explícita do arquivo de teste.
- expo install --check: dependências compatíveis.
- Expo Doctor1.21.4: 21/21 checks passaram.
- npm run export:ios: bundle Hermes iOS gerado (1104 módulos).
- Metro LAN porta8083: /status respondeu packager-status:running. Teste físico solicitado ao titular; nenhum retorno ainda nesta evidência.
- npm audit inicial: 28 alertas (18 altos/10 moderados). Overrides decode-uri-component0.5.0 e uuid11.1.1 removeram os 10 moderados; typecheck/testes/bundle revalidados após mudança. Permanecem 18 altos propagados por braces/node-forge sem versão corrigida no registry consultado. [Revisão](../docs/security/DEPENDENCIES.md).

Sem fake de login financeiro, backend, .env ou credencial. Tela informa ambiente demonstrativo e ausência de banco. A T07 fica review até confirmação física; artefatos verificados podem alimentar T09 (checks automatizados), que não depende de validar hardware e será a próxima task local. Não transformar essa exceção limitada em liberação de dados reais.
