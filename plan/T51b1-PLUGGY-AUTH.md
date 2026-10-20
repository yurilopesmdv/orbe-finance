# T51b1 — autenticação server-side do fornecedor

20/10/2026. MPG-13/MPG-02, SEC-05/12/17. Integrador único, sequência autorizada. Depende T18b1/T51c e confirmação pública do contrato, não de credenciais reais.

Problema: falta o adaptador de autenticação Pluggy. Implementar preparação segura sem abrir tráfego real/consentimentos. Paths: supabase/functions/_shared/pluggy-auth.ts, tests/bridge/pluggy-auth.test.mjs, allowlist administrativa explícita e package.json para checks; documentação/checkpoints. Não alterar entrypoints publicados, migrations, flags cliente ou configuração remota. Nenhum segredo Pluggy solicitado.

Factory off retorna disabled sem ler config/clock/transport. Fixtures explicitamente ativadas recebem transporte/relógio e configuração capturada. POST/auth destino literal, sem cookies/redirect/cache; limite4KiB, timeout20s, erro genérico, singleflight ocupado sem segunda emissão. Cache privado de prontidão/chave por119min; timer/clock/close purgam, cancelamento/timeout/resultado tardio não promovem. Somente status genérico retorna; chave nunca escapa. Sem callback arbitrário que receba a chave.

Aceite: testes de off-zeroports, origem/configimutáveis, corpo/cabeçalhos, cache/expiração, concorrência, close/cancel/timeout com late-result, MIME/JSON/tamanho/UTF8/schema,429/5xx/redirect/erro sanitizados. Typechecks/suíte, sourceguard cliente/entrypoints e scan segredos, commit/push/CI. Não republicar app por alteração backend inativa.

Fontes públicas20/10: https://docs.pluggy.ai/en/reference/authentication e https://docs.pluggy.ai/en/docs/authentication descrevem POST/auth e chave2h; guia pessoal https://docs.pluggy.ai/en/docs/guides/meu-pluggy-personal-use confirma proxy diário, sem listagem global/refresh e autorização anual distinta. Sem chamadas autenticadas/reais na investigação.

Próximo: T54a alcance das dependências no runtime e artefatos; T51b2 leituras/IDs upstream depende SEC-05/logs. Gate T63/T78 e runtime permanecem fechados; não resolver incompatibilidade de privacidade apenas mudando flag.

Evidência:657 testes/dois typechecks passaram.19 novos casos cobrem off, configuração capturada, redefixa, limites/schema/MIME/UTF8, cancelamento/prazo, concorrência/cache/close e isolamento cliente/entrypoints. Não foram consultadas contas ou credenciais reais.
