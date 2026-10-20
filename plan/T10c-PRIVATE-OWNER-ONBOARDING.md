# T10c — acesso inicial pessoal pelo app

20/10/2026. AUTH-14/15, ADR-013. Integrador único. Usuário confirmou preview funciona, mas não sabe criar acesso; deseja só ele agora e demais cadastros desabilitados.

Fatia1: helper scripts/owner-setup.py e testes administrativos com mocks. Inspecionar projeto saudável/ownerprovisionado, signupfechado e OTP6/600; buscar somente Authuser do UUID privado, validar confirmado/não anônimo, gerar recoverycode sem e-mail por /admin/generate_link. Usar chave serviço somente em memória, fora Expo/CLI logs. Arquivo owner-setup.txt0600 em ~/.config/orbe-finance com e-mail/código/expiração, nunca stdout. Rejeitar symlink/owner errado/key ausente/resposta OTPinválida. Nome/contato não viram fixture. Não executar helper real até tela publicada.

Fatia2: formulário /create-account para ativação privada reutiliza SessionModel.resetPassword/gatewayseguro; confirmação de senha local, limpeza ao submit/blur/AppState, sucesso pede login. Atalhos home/login. runtime.ownerSetupEnabledtrue, publicRegistrationEnabledfalse. Preparação futura registration.ts com gate capturado/desligado, signup via destinofixo/limite/cancelamento e sessão descartada, sem promover owner. Nenhum Auth/RLS/SMTPtoggle remoto.

Fatia3: check/export/scan/CI/commit/push/publicação iOS preview e QR/manifest; só então gerar código real no arquivo privado e instruir titular a abrir localmente, nunca colar no chat. Aceite positivo da senha ocorre apenas no aparelho; testes reais de Auth se necessários só identidades fictícias com cleanup, nunca senha do titular. Gate real financeiro continuafalse.

Fontes oficiais20/10/2026: https://supabase.com/docs/reference/javascript/auth-admin-generatelink; https://supabase.com/docs/reference/javascript/auth-verifyotp; https://supabase.com/docs/guides/auth/auth-email-passwordless (OTPexp rege recovery). generate_link não envia email; não confundir com inviteUserByEmail.
