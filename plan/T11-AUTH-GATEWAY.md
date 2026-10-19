# T11 — Login, recuperação e logout

T11a done; T11b pendente. AUTH-03/06. 19/10/2026. Responsável sequencial. T11a depende de contrato T10a; T11b exige T10b/integração de configuração pública. Paths src/features/auth/gateway.ts, tests/auth e checkpoints.

Gateway REST restrito à origem do projeto e chave publishable. Senha apenas em corpo; validar token, get user e autorização server-side. Token/expiração somente em memória; sem refresh persistido. Recuperação não produz sessão de login e revoga sessão temporária. Falhas de rede/abort/429/credencial malformada padronizadas, sem payloads. Nenhuma nova dependência.

Aceite: senha/chaves não vão para query string, outra origem/segredo administrativo rejeitados, dono não autorizado não recebe sessão, timeout/cancelamento e erros sanitizados; reset exige proprietário e signout. Testes transporte fake; não usar senha/email reais nas ferramentas. UI/AppState/SMTP/físico continuam pendentes.

Referências oficiais consultadas em19/10/2026: https://github.com/supabase/auth/blob/master/openapi.yaml e https://supabase.com/docs/reference/javascript/auth-signout.

## Evidência T11a

TypeScript e129 testes passaram, incluindo20 cenários do gateway. Cobertos dono negado/identidade inválida/anônima, segredo administrativo recusado, origem estrita, senha fora da URL, cancelamento/deadline (inclusive transporte que ignora abort), JSON/erros sanitizados e recuperação encerrada sem sessão de login. Sem requests reais de senha/email e sem importar o spike. Gateway ainda não ligado à UI; não declarar login físico/SMTP homologados.
