# T51b2c3 — resolução privada de vínculos

20/10/2026 MPG-18; integrador único, depende T51b2c2 e migrations metadata/lease. Paths nova20261020120000_account_read_bindings.sql, tests/admin/account-bindings.sql, backend-admin/test harness, _shared/account-binding-rest.ts, account-read.ts e testes. Nova RPCservice-only confere checkleaseaccounts sob lock; retorna owner/conexão/revisão/projeção mínima de bindings, sem finanças/PII. Datas de saldo/relação/cobertura conservadoras; não provisiona. RPC não substitui Authremoto do handler. PortREST POSTliteral comsecret serverbody, transporte fixtureinjetado e prazo20s/abort.

Aceite: SQL grants/anon/auth denied, owner/IDOR/revision/lease/paused/expired/missingbinding negados; positivo somente IDsfictícios e null/unknown/false; rollback e ownerpreserved. Port snapshots/config/IDs/limits/no redirects/no rawerrors/defaultoff/cancel/deadline; handler transmite lease. Typechecks/suíte, aplicar migration própria e SQLrollback, scan/commit/push/CI. Nenhum segredoPluggy/consentimento/financeiroreal/deploy. Próxima loteHTTP/memóriaapp e checklist da ativação conjunta.

Concluída:768 testes/typechecks,7 REST+2 runner. Migration8 aplicada pelo runner/hash; SQL rollback no projeto próprio aprovado com zero identidades fictícias e owner preservado. Sem vínculo bancário real/credenciais de fornecedor.
