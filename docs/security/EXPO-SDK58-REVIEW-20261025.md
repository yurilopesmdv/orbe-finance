# Migração Expo SDK 58 — 25/10/2026

SPEC014/T83, solicitada pelo titular para o Expo Go já instalado. Expo 58.0.19, React Native 0.88.0, React 19.3.0, expo-updates 58.0.18. Matriz oficial em `expo/bundledNativeModules.json`; módulos nativos e WebView14 alinhados. Fonte oficial: https://expo.dev/changelog/sdk-58.

AppState pode iniciar undefined: tratado como inativo/bloqueado, com regressão. WebView14 declara generic default undefined, resultando em props never; a tela fornece generic object explícito, sem casts/any ou relaxar validação de navegação. Teste de linking continua executando o código instalado, com a nova porta nativa getBundleOrigin injetada. Recibo e wrapper exigem runtime58, preservando scheme/projeto próprio/hashes/scans/recusa de code signing customizado. Recibos SDK57 são rejeitados. APIs de cache AES, SecureStore/passcode/deviceonly e screen-capture continuam tipadas; File.write já era aguardado por await.

## Dependências e tooling

Zod3.25.76 traz GHSA-mrhx-c7xc-m3w5; aplicado override restrito a @expo/cli para a correção oficial4.6.6. Testes executam os schemas reais de DevTools/MCP com fixtures válidas e inválidas. Fonte: https://github.com/advisories/GHSA-mrhx-c7xc-m3w5. Advisory antigo braces GHSA-vfj7-8cjw-p6xm foi retirado em23/10, sem suprimir resultado npm: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm.

Permanece GHSA-86w9-cpqp-85rv em node-forge1.4.0, sem patch publicado; npm reporta cinco pacotes afetados por essa única raiz. Fonte: https://github.com/advisories/GHSA-86w9-cpqp-85rv. **A dependência não foi declarada corrigida e a exceção sintética expirada não foi renovada.**

A política pessoal já autorizada em OWNER-RELEASE-20261021 passou a ser verificada no comando de auditoria: somente projeto Orbe/schemeorbe/runtime58/integração pessoal, sem assinatura customizada; grafo restrito às versões revisadas de expo58.0.19, @expo/cli58.1.15, @expo/code-signing-certificates0.0.7, expo-updates58.0.18 e node-forge1.4.0, em suas localizações exatas. Advisory novo, crítico ou instância diferente falha. Exige relatório de runtime sem node-forge, vinculado ao SHA256 do lockfile atual. CI gera primeiro esse relatório e depois valida auditoria. As restrições de publicação e isolamento do ambiente continuam ativas. Sem certificação do binário Expo Go, serviço EAS ou toda cadeia de tooling.

## Transporte iOS revisado

Comparação com as fontes SDK57 do próprio Orbe: fetch.ts e FetchResponse.ts idênticos; RequestUtils só reordena imports. Os fontes iOS foram movidos para ios/Expo/Fetch. NativeRequestInit, ExpoURLSessionTask, NativeResponse e ExpoFetchCustomExtension idênticos. ExpoFetchModule acrescenta rejeição de promises quando leitura text/arrayBuffer recebe estado errorReceived; sem mudança de sessão/cookies/redirect/cache nessas fontes. Mantidas as limitações anteriores: configuração URLSession do host não é certificada como ephemeral, nem comparada byte a byte ao Expo Go instalado. Nenhuma sessão bancária/valor foi usada para testar.

| Fonte instalada | SHA256 |
|---|---|
| `expo/src/winter/fetch/fetch.ts` | `58337a99fcc955ce20f80043489712d73149fea97a1b6034790e2050d63d2819` |
| `expo/src/winter/fetch/FetchResponse.ts` | `563bf4d82d66b797c02ff76f92a0c6fc0b80f78f311aadb4f3b4d8898faf575f` |
| `expo/src/winter/fetch/RequestUtils.ts` | `d5c983049e4d5a525dba9db334660c731073de74bce0ff12536efa37b9386567` |
| `expo/ios/Expo/Fetch/NativeRequestInit.swift` | `7b28018cc95d36ee50ccf74a7d793e0d7c790c4375ee7ffc6447efd4df70cc55` |
| `expo/ios/Expo/Fetch/ExpoFetchModule.swift` | `313c5ee727bad075b7f53c8ce6b0900e75a8cae185c45ad9dcdfcec32a061267` |
| `expo/ios/Expo/Fetch/ExpoURLSessionTask.swift` | `9db541ccf42a74466d110f76189aed52b534f3b51b91688366e62a05df520b7c` |
| `expo/ios/Expo/Fetch/NativeResponse.swift` | `1bbfb4f76779b3226b82aa6000fd29d726ea84029a2a59d35854d1b5633fd53a` |
| `expo/ios/Expo/Fetch/ExpoFetchCustomExtension.swift` | `63bb32a1b130b2cdbc757b229338ef4c28cc894a7576092e14e543c8fb758444` |


Validação local: 1281 checks (1133 Node + 148 Python), tipos cliente/backend, compatibilidade Expo, export iOS/Hermes, auditoria1299fontes/50instâncias, scan de todos os perfis e allowlist47, preflight25artefatos aprovados. Python3.13.12 usado; teste inicial com Python3.8 falhou por tomllib e foi repetido com a versão compatível já instalada. CI e publicação serão registrados no STATE/EXPO-PREVIEW.
