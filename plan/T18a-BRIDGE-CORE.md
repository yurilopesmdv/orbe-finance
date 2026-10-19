# T18a — Núcleo HTTP da ponte

Estado: done. MPG-02/03/06/09, SEC-05/07/12. Depende T13/T50a/b. Responsável integrador único.

## Escopo

Funções puras em supabase/functions/_shared, Request/Response web standard, sem SDK/import de cliente/serviço externo. createBridgeHandler recebe ports de autenticação e listagem de metadados e enabled=false por padrão. Única rota POST /connections/status, JSON {}, sem query/URLs/cookies. Limite16KiB real por streaming (não confiar content-length), deadline20s e signal. Authenticate retorna unknown para validação defensiva do principal(owner/UUID/expiração). Metadata retorna unknown para validação/projeção estritas, mesma identidade por linha, até100 linhas e IDs únicos. Instituições/estados/capacidades/datas/revisão explícitos. Corpo de saída não contém owner, item externo, descrição livre, conta bancária ou extras.

Portas são somente contrato nesta task: não há implementação Auth/DB/Pluggy real nem entrypoint Deno, deploy ou alteração de runtime flags do app. Deno não instalado; typecheck específico sem React separado e testes Node22 Request/Response. T18b depende comprovação oficial/runtime e adapters Auth/RLS; T18c provedor/provisionamento ainda depende T03/T63. T18 integral segue pendente.

## Paths

specs/009-meu-pluggy/spec.md; plan/T18a-BRIDGE-CORE.md; supabase/functions/_shared/bridge.ts; tsconfig.bridge.json; tests/bridge/handler.test.mjs; package.json; docs/security/BRIDGE-CORE.md; tasks/TASKS.md; roadmap/STATE.md; AGENTS.md.

## Aceite

Desligado: zero acesso a getters/ports/corpo/clock. Validar método/rota/query/token/body/bytes e segundo usuário/expiração antes de metadata. Fixtures com extras privados não vazam; rowowner/tipos/datas inválidos falham sem dados. Timeout/auth tardia não chama metadata; abort body/ports libera recursos. No-store/sem redirects/sem CORS/logs. Typecheck do núcleo+suíte completa; CI deve executar ambos. Nenhum banco real ou secret de provedor necessário.

## Resultado

Typecheck do cliente e da ponte +255 testes passaram, incluindo21 novos HTTP/cancelamento/projeção/UTF-8/identidade imutável. Nenhum endpoint publicado, Deno instalado ou fornecedor consultado. CI anterior d62e27b aprovada; próximo push inclui automaticamente typecheck da ponte por npm run check.
