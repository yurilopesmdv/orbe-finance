# T65b1 — proteção nativa antes de telas privadas

20/10/2026; SEC-09/18/25; integrador único; depende T65a e SDK57.0.4 (bundledNativeModules). Paths src/features/privacy/screen-protection.ts/native-screen.ts/provider.tsx, components/private-screen.tsx/ui.tsx, app/_layout.tsx, runtime/package/lock/testes e docs. Sem API financeira/migration/custo.

Controller puro com snapshot ready/preparing/unavailable/closed + active, start idempotente/cancelamento por geração/deadline5s. Provider monta no root sem bloquear Stack e fornece contexto às telas privadas; AppState remove conteúdo antes de retomada. Native adapter instancia chave exclusiva por root e gerencia prevent/allow e blur através de fila serial/owners, evitando cleanup antigo desativar proteção atual. Falha nativa não libera tela privada; demo é saída explícita. Sem permissão de fotos ou upload de captura.

Instalar expo-screen-capture57.0.4 ignore-scripts/ambiente sem tokens. Tests de sucesso/falha/timeout/lateclose/foreground/concorrência/cleanup de donos e opções do adaptador; typechecks/suíte/SDK/audit/export/scan/CI/publicação/QR. Teste físico permanece por último, só sintéticos. Compatibilidade documental https://docs.expo.dev/versions/v57.0.0/sdk/screen-capture/ não equivale a homologação do aparelho. APIs capturadas no hostSDK, sem browser/manual screenshots de informações privadas.

Evidência local:710 testes/typechecks passaram (12 novos de controller/registry/adapter/limite React). Código iOS instalado revisado: OnDestroy restaura canvas e remove proteção de app-switcher; não é teste de dispositivo. Exports/audit/CI/publicação em andamento; não anunciar homologação física ainda.
