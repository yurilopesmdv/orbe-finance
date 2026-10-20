# ExpoFetch iOS — revisão de fonte em20/10/2026

SEC-26/T51b2c37. Fonte instalada expo57.0.30, sem requests bancários/inspeção do aparelho. ExpoGo informado57.0.9/SDK57; não há comparação byte a byte deste binário com os fontes locais.

| Controle | Evidência | Limite |
|---|---|---|
| CacheJS | fetch.ts só passa credentials/headers/method/redirect ao NativeRequestInit; cache não é encaminhado | cache:no-store no RequestInit não configura sozinho o cache nativo |
| Sessão nativa | ExpoFetchModule usa URLSessionConfiguration.default e admite provider nativo externo | Não é possível afirmar sessãoephemeral/cachezero pelo JS do Orbe; hostGo pode customizar |
| HTTP | Orbe envia no-store+no-cache/Pragma; respostasEdge no-store | RFC9111 define comportamento de caches conformes, não prova inexistência de cache prévio ou captura por runtime/SO |
| Cookies | ExpoURLSessionTask mapeia credentialsomit para httpShouldHandleCookiesfalse | Apple documenta que controla envio/armazenamento para orequest, não todo armazenamento do aplicativoExpoGo |
| Redirect | NativeResponse recusa seguimento e produz erro em redirecterror | Evidência de fonte instalada e testes de contrato, não teste físico do binárioGo |
| Cancelamento | JS aborta stream e chama NativeRequest.cancel; Swift cancela URLSessionTask | Cancelamento não apaga bytes já processados, commit remoto ou snapshots de terceiros |
| Observabilidade | Fonte src sem console/SDK deanalytics registrado nesta revisão; Expo documenta DevToolsNetwork/Memory | Não equivale a auditar telemetria/inspector do binárioGo. Não conectar ferramentas a dados reais; não há prova de exfiltração automática |

Correção: políticaHTTP única em src/lib/private-http.ts para Auth/status/comandos/gateway. A diretiva no-cache exige validação antes de reutilizar resposta; no-store sozinho não remove resposta jáguardada. Não adicionar queryaleatória comidentidade, Cookie ou Referer. Permanecem HTTPS/origemrestrita/corposinternos/semredirect/JSONbounded/cachefinanceirovolátil e gatesfalse.

A configuração nativa customizável está exposta em Swift, não como métodoJS do módulo instalado. Não tentar chamar APIinexistente ou usar EXPO_NO_DEV_MENU como garantia noSDK57: a documentação atual apresenta essa opção paraSDK58+. Não requerer contratação/buildpago como alternativa automática.

Fontes primárias: [RFC9111 cache](https://www.rfc-editor.org/rfc/rfc9111.html#name-no-store), [Apple cookies](https://developer.apple.com/documentation/foundation/urlrequest/httpshouldhandlecookies), [ExpoDevTools](https://docs.expo.dev/debugging/tools/). Documentação pública não substitui prova do aparelho e não promete privacidade absoluta.

## Inventário reproduzível

| Fonte instalada | SHA256 |
|---|---|
| `node_modules/expo/src/winter/fetch/fetch.ts` | `58337a99fcc955ce20f80043489712d73149fea97a1b6034790e2050d63d2819` |
| `node_modules/expo/src/winter/fetch/NativeRequest.ts` | `b7178cf1ea09304db7a2d3f8fdcf2ab25479068e413be3f09c15adc5d5d9a91b` |
| `node_modules/expo/src/winter/fetch/fetch.types.ts` | `0c60c7c70b1290173ea01fab3eee58f7c0da94c4a2c0d069ade109f3bdb5c0d1` |
| `node_modules/expo/ios/Fetch/NativeRequestInit.swift` | `7b28018cc95d36ee50ccf74a7d793e0d7c790c4375ee7ffc6447efd4df70cc55` |
| `node_modules/expo/ios/Fetch/ExpoFetchModule.swift` | `4e23605435443e9a0c40a4b694bbb775fa83befc14d53664d3f54261744d0381` |
| `node_modules/expo/ios/Fetch/ExpoURLSessionTask.swift` | `9db541ccf42a74466d110f76189aed52b534f3b51b91688366e62a05df520b7c` |
| `node_modules/expo/ios/Fetch/NativeResponse.swift` | `1bbfb4f76779b3226b82aa6000fd29d726ea84029a2a59d35854d1b5633fd53a` |
| `node_modules/expo/ios/Fetch/ExpoFetchCustomExtension.swift` | `63bb32a1b130b2cdbc757b229338ef4c28cc894a7576092e14e543c8fb758444` |

Hashes registram os arquivos lidos nesta máquina; não certificam o binárioExpoGo ou toda a cadeia de distribuição. Nenhum dado financeiro, credencial, URLdeitem ou sourcemap do aplicativo foi incluído no relatório.

A tela Minhasconexões passou também a aguardar Screenreadyactive antes de consultar status/metadados e encerra o controller ao perder prontidão. Assim o bloqueio antecede a consulta, além de esconder a renderização. Não afeta acesso aos dados inventados de demonstração.
