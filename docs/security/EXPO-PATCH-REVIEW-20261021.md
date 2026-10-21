# Patches Expo — revisão de21/10/2026

T22c21/SEC-38. Expo57.0.30→57.0.31 e Router57.0.28→57.0.29, SDK57/RN0.86.3 preservados. CI39630094209 aprovou testes e recusou compatibilidade após publicação dos patches. Instalação feita com ignore-scripts, sem migração major ou supressão de checks.

## Fontes e delta

O registro npm informou gitHead c5a313cb64de255fef39c54cc3c8d08537cf7133 para ambos os artefatos. [Changelog Expo](https://github.com/expo/expo/blob/c5a313cb64de255fef39c54cc3c8d08537cf7133/packages/expo/CHANGELOG.md) não anuncia mudança ao usuário nesse patch. [Changelog Router](https://github.com/expo/expo/blob/c5a313cb64de255fef39c54cc3c8d08537cf7133/packages/expo-router/CHANGELOG.md) registra ajustes de tipos, transição de abas, estado ao trocar identidade de rota, ícones e aparência iOS26. Revisados os quatro arquivosJS compilados alterados; linking/bootstrap do Router e fontesFetch não mudaram nos hashes capturados. Isso não certifica o binárioExpoGo instalado.

Lockfile também atualizou dependências do Expo: cli57.0.32, config-plugins57.0.11, router-server57.0.14, ui57.0.26, modules-core57.0.24, modules-jsi57.1.3, postcss8.5.31 e xcode4.0.0; uuid11.1.1 transitivo foi removido. Não houve alteração direta de RN, React, SDKmajor ou flags.70entradas de arquivos nos dois pacotes mudaram, incluindo artefatosAndroid/versionamento/maps; fontes de fetchJS/iOS permanecem iguais à revisão20/10.

## Transporte preservado

| Arquivo instalado | SHA256 após patch | Comparação |
|---|---|---|
| `node_modules/expo/src/winter/fetch/fetch.ts` | `58337a99fcc955ce20f80043489712d73149fea97a1b6034790e2050d63d2819` | idêntico |
| `node_modules/expo/src/winter/fetch/NativeRequest.ts` | `b7178cf1ea09304db7a2d3f8fdcf2ab25479068e413be3f09c15adc5d5d9a91b` | idêntico |
| `node_modules/expo/src/winter/fetch/fetch.types.ts` | `0c60c7c70b1290173ea01fab3eee58f7c0da94c4a2c0d069ade109f3bdb5c0d1` | idêntico |
| `node_modules/expo/ios/Fetch/NativeRequestInit.swift` | `7b28018cc95d36ee50ccf74a7d793e0d7c790c4375ee7ffc6447efd4df70cc55` | idêntico |
| `node_modules/expo/ios/Fetch/ExpoFetchModule.swift` | `4e23605435443e9a0c40a4b694bbb775fa83befc14d53664d3f54261744d0381` | idêntico |
| `node_modules/expo/ios/Fetch/ExpoURLSessionTask.swift` | `9db541ccf42a74466d110f76189aed52b534f3b51b91688366e62a05df520b7c` | idêntico |
| `node_modules/expo/ios/Fetch/NativeResponse.swift` | `1bbfb4f76779b3226b82aa6000fd29d726ea84029a2a59d35854d1b5633fd53a` | idêntico |
| `node_modules/expo/ios/Fetch/ExpoFetchCustomExtension.swift` | `63bb32a1b130b2cdbc757b229338ef4c28cc894a7576092e14e543c8fb758444` | idêntico |

## Validação e limites

1126testes/typechecks aprovados; expo install--check passou; exportaçãoiOS e auditoria1205fontes/56instâncias aprovadas. braces/node-forge ausentes do JScliente; sourcemaps privados. Scan de todos os perfis contra fonte/export e diffcheck aprovados. Auditoria ainda encontra19instâncias em2advisories sem patch: exceção permanece só sintética até23/10, sem extensão. Patches de compatibilidade não resolvem esses advisories nem autorizam dados reais. CI deste commit deve ser conferida antes de publicarcliente.

Nenhum token/IDbancário/payload/conta/valorreal foi incluído. Backend continua nas versões publicadasv6/v4 com código financeirooff; patches ainda não publicados no EAS. Próxima integração decontroller/runtime de movimentos é independente da validação física final.
