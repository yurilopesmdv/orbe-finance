# T02 — Spike sintético de acesso

Estado: done como spike sintético. Base 2a8ef01, 16/10/2026. Requisitos AUTH-01/03/04/06, correlatos AUTH-05/07 e SEC-12. Responsável único; sem agentes. Paths: spikes/access/session.mjs, spikes/access/session.test.mjs, esta evidência, SPEC-001, TASKS e STATE. Nenhum bootstrap do app ou SDK instalado.

Node22 nativo, node:test/assert, sem dependências. Provedor é porta injetada e fake estritamente local nos testes; nenhuma chamada de rede, credencial ou banco real. Testar races login/background/logout, consulta tardia, erro sanitizado, segunda identidade, expiração e recuperação inválida/válida com novo login. Estado público não contém token/senha. AppState será conectado posteriormente à porta setAppState; teste de função não comprova captura física do alternador.

Adaptador futuro Supabase: signInWithPassword, resetPasswordForEmail e verifyOtp recovery + atualização de senha, sem cadastro público. Usar cliente de recuperação isolado e sem persistência, descartar sessão de recuperação após reset; não tratar evento PASSWORD_RECOVERY como login financeiro. Código OTP evita depender de scheme próprio; validade/reenvio/SMTP dependem da configuração real e continuam não homologados.

Fontes oficiais consultadas: [login](https://supabase.com/docs/reference/javascript/auth-signinwithpassword), [OTP](https://supabase.com/docs/reference/javascript/auth-verifyotp), [AppState](https://reactnative.dev/docs/appstate). Estados inactive no iOS também exigem bloqueio, mesmo antes de background.

## Evidência executada

Node22 --test spikes/access/session.test.mjs: 20 casos passaram. Login de proprietário/identidade indevida, rede/rate-limit, sanitização de erro, inactive/background, login concorrente, resposta tardia após logout/expiração, recuperação genérica/código expirado/reset e senha fraca cobertos. Não há dependências, filesystem, rede ou persistência no spike.

Limites: fake não comprova Supabase/SMTP, validade real de OTP, políticas remotas, captura de tela ou eventos no iPhone. Port signOut deve descartar apenas a sessão recebida em cliente isolado; nunca usar revogação global de sessões no cleanup de login tardio, pois poderia invalidar login mais novo. Teste físico/integração remota seguem em T11/T12/T38. Próxima task T03: investigar termos/cotas/trilha pessoal em fontes públicas, sem ativar conexão.
