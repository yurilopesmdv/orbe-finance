# Abrir o Orbe no Expo Go

Prévia iOS publicada20/10/2026, SDK57, sem PC/Metro/rede local. O QR está preparado para o teste final; não é necessário testar durante as tasks.

![QR remoto do Orbe](assets/orbe-expo-go-20261020.png)

Link direto: exp://u.expo.dev/update/01a15ba3-efdc-7ce4-b328-fa16a89c0e12

Projeto EAS69843dfe-ab1b-469e-bb78-c7948bbf1d9b · preview · runtimeexposdk:57.0.0 · update01a15ba3-efdc-7ce4-b328-fa16a89c0e12 · grupo41095d0a-c262-4850-a4ab-122bdce6caf0 · commitbe80325.

**Seu acesso já existe:** não recrie a conta nem gere outro código. Sessão lembrada e proteção de captura/multitarefa foram confirmadas pelo titular e são preservadas. Coldrestart/logout/gravação/VoiceOver seguem no roteiro final, sem inferir aceite de outras versões.

Esta prévia inclui a infraestrutura cliente de preparação das conexões e a tela Minhas contas, mantendo a interface existente. **Leitura e descoberta bancárias reais continuam desativadas**: inventoryDiscoveryEnabled/accountReadsEnabled/liveIntegrationEnabled/privateFinancialDataApprovedfalse. A ação Prepararconexão fica oculta até a liberação. Status autenticado de conexões e demonstração de gastos/carteira/metas/relatórios continuam disponíveis. O backendv4 também tem liveApprovedfalse; a publicação não busca saldos nem movimentações.

958testes/typechecks, exportHermes e runtimeaudit1204fontes/56instâncias aprovados; [CI39514871905](https://github.com/yurilopesmdv/orbe-finance/actions/runs/39514871905) success. Todos os perfis privados comparados contra fonte/export antes do upload. Manifesto remoto schemeorbe/hashlaunchAsset igual aoHBC local/linkQRoficial conferidos; mapas privados não enviados.

Credenciais técnicas Pluggy autenticadas somente em1POST/auth, semGETfinanceiro/APIkeypersistida. Um vínculoMPpending cadastrado; Bradesco confirmado na origem, item na aplicação ainda não identificado. Não confundir o item selecionado noDashboard com a contagem de bancos no portal pessoal. [Acesso](ACCOUNT-ACCESS.md), [ativação](ACCOUNT-ACTIVATION.md), [prontidão](RELEASE-READINESS.md).

ExpoGo/orçamentozero/cores/identidade mantidos. Cadastro de terceiros, FaceID e recuperação por e-mail continuam desabilitados. Nenhuma contratação, nenhuma leitura financeira pelas ferramentas e nenhuma solicitação de teste intermediário.
