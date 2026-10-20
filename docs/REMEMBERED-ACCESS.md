# Manter seu acesso no iPhone

Na prévia publicada com T12b, entre uma vez com seu e-mail e senha e deixe **Manter meu acesso neste iPhone** ligado. O Orbe poderá retomar o acesso automaticamente ao reabrir ou voltar ao aplicativo, com internet, por até30dias desde esse login. Não precisa recriar a conta nem gerar código de ativação.

O aplicativo não salva sua senha. Guarda apenas um refresh token, a origem pública do projeto e o prazo local em SecureStore/Keychain, acessível somente com o iPhone desbloqueado e com código de bloqueio configurado. A opção THIS_DEVICE_ONLY impede migração dessa entrada para outro aparelho. Isso não torna o Orbe biométrico: FaceID e requireAuthentication não são suportados nesse Expo Go iOS. Quem estiver com o aparelho desbloqueado poderá retomar o acesso. Não se promete exclusão em desinstalação, zeragem de heap, ou proteção contra aparelho comprometido.

Ao ir para segundo plano, o Orbe bloqueia o conteúdo, cancela consultas e retira o access token da sessão em memória. Ao voltar, usa a credencial protegida para renovar e validar sessão/proprietário no servidor, sem armazenar o access token. Sem internet, mantém conteúdo bloqueado e permite tentar retomar depois. Token recusado/prazo encerrado exigem senha. Ações sensíveis, como remoção de conexão, ainda exigem login recente com senha; refresh não satisfaz essa exigência.

**Sair da conta** remove o acesso salvo e tenta revogar a sessão no servidor. Também há **Esquecer acesso neste iPhone** quando a tentativa de retomada está disponível na tela de login. Sem memorização, o comportamento continua exigindo senha depois de sair do primeiro plano. Falha nativa é exibida; sem conseguir apagar localmente/revogar online, não se declara eliminação remota garantida. Não há fallback em arquivo ou AsyncStorage. Falha ao salvar permite somente a sessão atual e mostra que o acesso não ficou salvo.

## Operação/validação

AUTH-16/ADR-014; plan/T12b-REMEMBERED-SESSION.md. SDK57.0.4 do SecureStore está incluído no SDK57/ExpoGo do titular; código nativo seleciona WHEN_PASSCODE_SET_THIS_DEVICE_ONLY, requireAuthenticationfalse e keychainService próprio. Nenhum banco, payload financeiro, senha, e-mail ou UUID é persistido para retomada.

Gate de retomada: origem própria→refresh token rotativo→Authuser→owner→orbe_has_session→gravação serial do token novo→unlock. Geração/abort/fila recusam resultados tardios após logout; nenhuma credencial aparece em snapshots. Prazo local máximo30dias não foi apresentado como política paga de expiração server-side. Configuração remota e RLS não foram alteradas.

Testes de mocks e adaptador nativo não substituem teste físico do Keychain no aparelho. No iPhone, validar somente comportamento genérico: entrar uma vez, alternar/reabrir, retomar sem senha, sair e confirmar senha exigida depois. Não enviar tokens/senhas/prints privados pelo chat. Não conectar bancos para validar a sessão.

Publicada20/10/2026: update01a15971-ed8f-7228-908b-945be1207249, commiteb9c865, CI39428239529 aprovada,686 testes/typechecks/export/scan e manifesto/hash conferidos. Teste físico segue pendente.
