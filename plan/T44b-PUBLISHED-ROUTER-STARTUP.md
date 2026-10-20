# T44b — corrigir inicialização publicada

20/10/2026. UX-18. Integrador único; depende T44a publicada. Titular abriu update01a1591f/SDK57 no iPhone e reportou erro real “Cannot make a deep link into a standalone app with no custom scheme defined” no ContextNavigator. Fonte instalada expo-linking/build/Schemes.js resolveScheme lança precisamente esse erro em produção/standalone semscheme.

Paths: app.json schemeorbe, preflight eas-safe.mjs, teste de regressão contra código instalado expo-linking (transpilação CommonJS/VM com Constants/Platform inventados, sem nativebuild), package.json/checkpoints. Provar que config anterior reproduz erro e nova resolve/createURL sem lançar no contexto do crash. Não simular que VM é iPhone.

Aceite: check/export/scan/CI, nova publicação/manifest comschemeorbe, QR atualizado. Primeiro QR manifest válido não prova app funcional, queda física registrada. Nenhuma mudança em login/backend/gates/FaceID.
