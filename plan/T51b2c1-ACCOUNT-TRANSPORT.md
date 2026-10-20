# T51b2c1 — transporte restrito de contas

20/10/2026, MPG-16, integrador único. Dependências T51b1/T51b2a/T51b2b1/b2. Paths pluggy-auth.ts, testes de transporte, scripts allowlist se necessário, tasks/STATE. Sem deploy/publicação/segredos reais. A API authenticate/close existente permanece idêntica; nova factory compartilha a closure técnica, retorna só DTO projetado/status. Antes da rede capturar/validar contexto e inicializar decoder; leitura restrita ao builder accounts, deadline total20s e cancelamento. Close mata auth/read e timers; concorrência busy; sem retries. Headers e parsing conforme fonte oficial consultada20/10: https://docs.pluggy.ai/en/reference/account/accounts-list (GET, itemId, X-API-KEY, página de contas).

Aceite: zero trabalho off, AuthAPI intacta, auth→read→centavos mínimo sem PII/chave, contexto imutável durante await, falha decoder/contexto antes de rede, redirects/status/schema/bytes/erro sanitizados, 401/403 purge,429 sem retry, cancel/close/deadline/late-result e concorrência. Typechecks/suíte/scan/commit/push/CI. Próxima T51b2c2 composição autenticada owner/sessão/lease; transporte sozinho não autoriza conta real.

Concluída:747 testes/typechecks,12 novos casos. Sem chamadas reais, deploy, SDK novo ou alteração do QR. API técnica não expõe chave; leitura só retorna DTO mínimo.
