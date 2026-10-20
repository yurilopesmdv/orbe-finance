# Criar seu acesso pessoal

Nesta versão só o titular pode entrar. A identidade já provisionada no Supabase recebe uma senha escolhida pelo próprio titular no aplicativo; não é necessário conhecer uma senha administrativa anterior. Cadastro de outras pessoas permanece desabilitado no cliente e no servidor. Não usar senha bancária.

1. Abra a prévia atualizada pelo [QR remoto](EXPO-PREVIEW.md) e toque em **Criar meu acesso**, na tela inicial ou no login.
2. No computador, abra o arquivo privado `~/.config/orbe-finance/owner-setup.txt`. Use o e-mail e o código de ativação indicados ali. Não envie seu conteúdo pelo chat.
3. No iPhone, informe esses dados, escolha e confirme uma senha de pelo menos 12 caracteres e toque em **Definir minha senha**.
4. Depois de confirmar a configuração, toque em **Ir para o login** e entre com seu e-mail e a senha que escolheu. Apague o arquivo de ativação após usá-lo.

O código é de uso único e dura 10 minutos; não é uma senha permanente. Se expirar, no terminal do projeto execute `npm run backend:owner:setup` com Node22 e abra novamente o arquivo privado. Isso gera outro código e invalida o anterior. O computador é necessário apenas para essa preparação administrativa, não para executar o app publicado. Não existe envio automático por e-mail nesta versão.

## Operação e segurança

`scripts/owner-setup.py` verifica projeto próprio saudável, cadastro público fechado, owner registrado, Authuser confirmado/não anônimo e OTP6/600. Consulta somente a identidade fixa do owner e chama generate_link recovery; nenhuma senha do titular é lida/definida nas ferramentas. Chave administrativa fica somente em memória. API/link/hash/respostas não são impressos nem persistidos. Apenas e-mail/código/prazo vão para arquivo0600 em diretório0700 fora do projeto/Metro; caminhos simbólicos/hardlinks são recusados. Gerar o código somente depois da publicação da tela.

No dispositivo, a ativação verifica OTP/identidade/owner antes de atualizar senha. A sessão temporária é descartada e o aplicativo exige um login novo; o fluxo de ativação não libera metadados ou dados financeiros. Campos são limpos ao enviar, perder foco ou mudar para segundo plano. Não se afirma eliminação garantida de strings do heap JavaScript ou bloqueio de screenshots nativos do Expo Go.

`runtime.ownerSetupEnabled=true` disponibiliza o fluxo privado. `runtime.publicRegistrationEnabled=false` e `disable_signup=true` mantêm cadastro público fechado. A porta futura de cadastro é desacoplada, desligada por padrão, não concede privilégio de proprietário e descarta qualquer sessão inesperada. Habilitar usuários adicionais exige ADR de admissão, confirmação de e-mail/SMTP e isolamento RLS/ponte por usuário. Mudar uma flag não conclui esse trabalho.

Recuperação por e-mail continua desligada até entrega comprovada. O helper privado pode gerar novo código para o titular sem SMTP. Nenhuma conexão bancária, dado financeiro real ou Face ID foi habilitado por essa alteração. AUTH-14/15 e ADR-013 definem o contrato.

Validação20/10/2026: typechecks/638 testes locais e export iOS passaram. Smoke remoto com identidade fictícia confirmou formato OTP, verificação, atualização de senha, logout e login novo; não proprietário permaneceu negado e identidade foi removida. A senha do titular não foi acessada nem alterada. Teste positivo do titular depende da etapa no iPhone.
