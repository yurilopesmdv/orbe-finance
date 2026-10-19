# T11 — Login, recuperação e logout

T11a done; T11b pendente. AUTH-03/06. 19/10/2026. Responsável sequencial. T11a depende de contrato T10a; T11b exige T10b/integração de configuração pública. Paths src/features/auth/gateway.ts, tests/auth e checkpoints.

Gateway REST restrito à origem do projeto e chave publishable. Senha apenas em corpo; validar token, get user e autorização server-side. Token/expiração somente em memória; sem refresh persistido. Recuperação não produz sessão de login e revoga sessão temporária. Falhas de rede/abort/429/credencial malformada padronizadas, sem payloads. Nenhuma nova dependência.

Aceite: senha/chaves não vão para query string, outra origem/segredo administrativo rejeitados, dono não autorizado não recebe sessão, timeout/cancelamento e erros sanitizados; reset exige proprietário e signout. Testes transporte fake; não usar senha/email reais nas ferramentas. UI/AppState/SMTP/físico continuam pendentes.

Referências oficiais consultadas em19/10/2026: https://github.com/supabase/auth/blob/master/openapi.yaml e https://supabase.com/docs/reference/javascript/auth-signout.

## Evidência T11a

TypeScript e129 testes passaram, incluindo20 cenários do gateway. Cobertos dono negado/identidade inválida/anônima, segredo administrativo recusado, origem estrita, senha fora da URL, cancelamento/deadline (inclusive transporte que ignora abort), JSON/erros sanitizados e recuperação encerrada sem sessão de login. Sem requests reais de senha/email e sem importar o spike. Gateway ainda não ligado à UI; não declarar login físico/SMTP homologados.

## Plano T11b — doing

T10b agora provisionada. Paths adicionais: src/features/auth/session.ts/provider.tsx, src/config/auth.ts, rotas login/account, welcome e componentes Action. Helper administrativo configure-client extrai somente publishable key para .env.local, rejeita arquivo de outro projeto/variáveis desconhecidas e prepara template OTP; arquivo ignorado, sem senha/token privado.

Implementar máquina de sessão real independente do spike, gateway injetável e snapshot sem credencial; invalidar resultados tardios e timer. Testes de concorrência/expiração/recuperação/logout antes da UI. React provider usa useSyncExternalStore. Login/recuperação/reset/saída e rota protegida; nenhum financeiro real. T12 será próxima task de AppState. TypeScript/suíte/bundle e scanner de segredos administrativos; teste físico adiado conforme pedido.

### Restrição observada do provedor

Template customizado negado no plano Free/remetente padrão (HTTP400), confirmado sem imprimir dados privados. .env.local recebe EXPO_PUBLIC_AUTH_RECOVERY_ENABLED=false e UI não expõe pedido de código sem suporte. T11b separa login/sessão executável de recuperação efetiva pendente. Não contratar serviço ou pagar upgrade. Documentar decisão de SMTP e testar entrega posteriormente; nenhuma mensagem foi enviada nas ferramentas.

Smoke HTTP T11b: criar identidade Auth inteiramente inventada via API administrativa, email_confirm=true (sem enviar mensagem), executar o gateway real contra Supabase e comprovar negação por não ser proprietário; remover apenas essa identidade em finally. A chave administrativa fica na memória do processo Python, não no app/CLI/logs; filho Node recebe só chave pública e credenciais inventadas por stdin. Nunca usar senha/e-mail do titular; teste positivo com sua senha fica para o iPhone.

## Evidência T11b — login/logout e sessão implementados

TypeScript/160 testes passaram (18 de sessão real adicionais e3 de configuração pública). Bundle iOS com login/account gerado; PAT e UUID privado ausentes nos artefatos. Smoke real com credenciais inteiramente inventadas provou token Auth válido de não proprietário, RPC negada, gateway negado e anônimo negado; identidade removida em finally. Nenhum email enviado por ferramenta ou senha do titular lida.

T11b login/logout e telas prontas para teste físico final; T11c recuperação efetiva bloqueada pelo SMTP/template no Free. Gateway/telas de recuperação preparados mas flag false impede chamada sem suporte. Não marcar T11 integral concluída. Próxima T12 conecta AppState; não existem dados bancários reais nesta versão.
