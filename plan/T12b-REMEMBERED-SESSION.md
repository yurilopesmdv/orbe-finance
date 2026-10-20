# T12b — retomar sessão protegida no iPhone

20/10/2026; AUTH-16/ADR-014; integrador único. Depende T10/T12a/T10c e owner já provisionado. Escopo gateway/session/provider e vault SecureStore isolado, formulário login/account, testes e publicação iOS. Sem migration/afrouxamento RLS/SMTP. SDK SecureStore57.0.4 conferido no bundledNativeModules do Expo57 instalado; instalar fixado/ignore-scripts com ambiente público restrito.

1. Porta gateway para login lembrado/refresh capturados, retorno de refresh somente para modelo privado; nunca snapshot/UI/log. Refresh faz owner + sessão ativa. Fluxos antigos sem persistência continuam compatíveis.
2. Vault SecureStore de uma chave por origem/projeto, JSON limitado/estrito, token/privilégio mínimo e prazo30dias. Fila serial e geração para rotação/logout/cancelamento; nenhuma senha nem identity armazenadas. Falha fechada/sem fallback. Sessão antiga em memória continua suportada sem vault.
3. Modelo restaura ao abrir/retomar ativo e ao vencer access token; suspende memória/consultas no background sem revogar sessão lembrada. Logout explícito apaga vault/revoga melhor esforço; erros genéricos e nenhuma restauração tardia. Off/sem vault preserva comportamento anterior.
4. Switch Manter meu acesso no login, ação Tentar retomar para falha de rede e descrição honesta da sessão em account. Sem redesign/FaceID. Typechecks/suíte/testes adversariais, export/audit grafo/scan/CI, publicação/QR novo. Teste físico último; não acessar senha ou token real do titular.

Aceite em mocks: rotação/owner/session gate; restart/foreground sem senha; expiry/backend denial limpa; rede indisponível bloqueia sem apagar sessão válida; falha de escrita nunca afirma salvo; logout versus write/refresh tardios; sem token em snapshot; keychain indisponível/ausência de código sem persistência; sessão recovery nunca salva. Smoke remoto somente identidade fictícia se necessário, com cleanup. Código de app não habilita instituições reais.

Evidência local:686 testes/typechecks,22 novos cenários de modelo/vault/gateway/adaptador; export iOS e inspeção de1166 fontes/54 pacotes passaram. Smoke HTTP com identidade fictícia comprovou refresh, autorização negada ao não owner e revogação por logout (refreshposteriorrecusado); identidade removida. Aprovação nativa ainda depende do teste no aparelho.
