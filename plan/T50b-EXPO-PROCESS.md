# T50b — Processo Expo isolado

Estado: done. SEC-19/20, depende T50a. Responsável integrador único. Paths: scripts/expo-environment.mjs, scripts/expo-safe.mjs, tests/security/expo-environment.test.mjs, package.json, docs/security/DEVELOPMENT-SECRETS.md, docs/DESENVOLVIMENTO.md, specs/006-security/spec.md, roadmap/STATE.md, tasks/TASKS.md, AGENTS.md.

## Implementação

Whitelist de variáveis básicas do SO preserva HOME, sem reaproveitá-lo como variável de tarefa. Ler apenas três EXPO_PUBLIC conhecidas dos dotenv padrão (precedência development/production local); recusar qualquer chave desconhecida, duplicata ou sintaxe ambígua em .env*. Pointer backend é validado estruturalmente mas não lido. Nenhuma variável privada entra no filho. Isolar perfil em ~/.config/orbe-finance/expo-cli (0700), usando __UNSAFE_EXPO_HOME_DIRECTORY suportado pelo SDK57 instalado; verificar interface no código instalado. EXPO_NO_DOTENV=1/EXPO_OFFLINE=1/EXPO_NO_TELEMETRY=1 explícitos. Execução direta do CLI é fora do caminho suportado.

Comandos start (--lan padrão ou --localhost, --port 1024..65535, --clear) e export (--platform ios fixo). npm ios usa o mesmo start, sem abrir simulador em Linux. Sem túnel/publicação/credenciais. Testar allowlist com sentinelas inventadas, recusa inline e CLIhome externo/symlink, precedência e argumentos. Export real usa wrapper, não abrir LAN.

## Aceite

Processo filho não recebe sentinelas privadas nem dotenv desconhecido; public config e SO necessário preservados. Diretório CLI separado e protegido; typecheck/testes/export Hermes/scan privado passam. Documentar limites e próxima T18a.

## Evidência

234 testes/TypeScript aprovados, incluindo10 novos testes do ambiente/CLI real/processo filho. Export Hermes iOS passou pelo wrapper; public URL/key presentes e PAT/UUID privados ausentes nos artefatos. Nenhum servidor LAN aberto.
