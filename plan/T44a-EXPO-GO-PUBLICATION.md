# T44a — publicação hospedada e QR Expo Go

20/10/2026. UX-17/SEC-02/11/18. Integrador único; depende check/export/scan/CI já aprovados. Titular substituiu teste LAN por publicação remota; Metro parado. Não continuar diagnóstico firewall.

1. Confirmar EAS CLI oficial compatível e fluxo ExpoGo SDK57; versão consultada25.2.0, Node22 atende.
2. Preparar helper EAS com ambiente allowlist existente/perfil privado próprio, sem EXPO_OFFLINE e sem herdar tokens. Login exclusivamente navegador, nunca senha/OTP no chat/argv.
3. Autenticar conta correspondente ao Expo Go; usuário confirmou Go logado, perfil privado CLI sem sessão. Se precisa ação humana, pedir somente login pelo helper pronto e continuar preparação independente.
4. Associar/criar projeto Orbe próprio gratuito, config pública projectId/owner/slug revisada; nenhum projeto F1. Preparar runtime/sdk para Go seguindo contrato da CLI. Não usar update:configure automaticamente se criar runtime incompatível com Go.
5. Export seguro com config pública, check/scan e publicar atualização iOS por branch preview/environmentpreview via dist pré-validado/skip-bundler, sem source maps e sem banco real. Guardar recibo remoto; verificar updategroup/manifest/assets e gerar QR local do link oficial.

Paths: scripts/eas-safe.mjs e apoio/testes, package.json, app.config.ts/eas.json se necessários depois de associação, docs/checkpoints. Sem supabase migrations/gates financeiros.

Fontes20/10/2026: https://docs.expo.dev/eas/cli/ (update,input-dir,skip-bundler,environment); https://docs.expo.dev/more/qr-codes/ (ExpoGo QR por update/group); https://expo.dev/changelog/expo-go-loading-changes-may-2026 (Go só projetos próprios/org membro, HBC em EASUpdate); https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/ (conta CLI/Go; devserver).

Aceite: update remoto confirmado e QR válido ExpoGo, sem Metro. Se falta sessão do titular, publicar fica pendente, nunca alegar “publicado” só pelo Git. Produto bancário completo permanece gated.

Implementação: helper com operações version/account/init/publish fixas, CLI25.2.0 cacheado sem scripts antes de receber token; publicação usa cacheoffline e dist exportado pelo launcher sem token. Config estática app.json substitui app.config.ts sem lógica dinâmica, para associação EAS rastreável. Runtime sdkVersion57 explícito para Go, sem módulo nativo novo.
