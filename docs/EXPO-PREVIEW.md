# Abrir o Orbe no Expo Go

Prévia iOS publicada em21/10/2026, SDK57, sem PC, Metro ou rede local. O teste no aparelho fica para quando o titular estiver disponível.

![QR remoto do Orbe](assets/orbe-expo-go-20261021.png)

Link direto: exp://u.expo.dev/update/01a15f77-2cb3-7872-a3e3-49625880255e

Projeto EAS69843dfe-ab1b-469e-bb78-c7948bbf1d9b · preview · runtimeexposdk:57.0.0 · update01a15f77-2cb3-7872-a3e3-49625880255e · grupoa5771241-b969-4c16-8b56-b6d085ba302e · commite33928e.

## O que está nesta versão

Seu acesso mantém a sessão lembrada e as proteções já confirmadas. Não recrie a conta nem gere novo código. Abra **Seu acesso → Ver minhas movimentações** ou **Ver meus investimentos**. As telas estão disponíveis e indicam que a leitura real ainda está em preparação. A tela de investimentos oferece bruto/líquido/data e filtros quando habilitada; não inventa identificação de cofrinhos ou total duplicado.

A demonstração de gastos, carteira, metas e relatórios continua separada do acesso privado. Foram preservados o layout e a identidade visual atuais. Cliente/backend têm fluxos completos de contas, movimentos e investimentos validados com fonte fictícia; **nenhum desses testes comprova homologação de suas contas pessoais**.

Leitura/descoberta bancária real continua desligada: liveIntegration/accountReads/movementReads/investmentReads/inventoryDiscovery/privateFinancialDataApprovedfalse. Bridgev7ACTIVE tem `liveApproved:false`; metadata v4 preserva o snapshot anterior.17migrations aplicadas/hashverificadas. Banco guarda somente metadados, sem saldos, movimentos ou posições financeiras.

## Validação da publicação

1201verificações (1069Node+132Python), tiposcliente/backend, exportHermes e auditoria1216fontes/56instâncias aprovados. [CI39642075250](https://github.com/yurilopesmdv/orbe-finance/actions/runs/39642075250) success. Fonte e export comparados com todos os perfis privados antes do upload. Manifesto comschemeorbe e hashlaunchAssetigualaoHBC local; linkQRoficial conferido. Sourcemaps privados.

Backendv7:11casos negativos das rotas desativadas passaram com503/no-store, sem consultar provedor. FixtureSQL de posições/progresso passou instalada comrollback/zeroresíduos/ownerpreservado. Testes integrados1000investimentos e500movimentos são exclusivamente sintéticos.

## Limites restantes

A ativação real depende das evidências de origem Open Finance por banco, fornecedor e runtime/dependências em [prontidão](RELEASE-READINESS.md). Os gates não foram removidos para simular conclusão. Cofrinhos exigem natureza/vínculo explícitos da fonte. Cadastro de terceiros, FaceID e recuperação por e-mail seguem desligados; ExpoGo e orçamentozero mantidos.

Seu acesso já existe. Titular confirmou retomada ao alternar apps, captura e multitarefa; coldrestart/logout/gravação/VoiceOver seguem no roteiro final. Nenhum dado bancário deve ser enviado no chat ou em imagens. Não houve nova autorização bancária, contratação ou leitura de finanças pelas ferramentas.

[Acesso](ACCOUNT-ACCESS.md) · [Ativação](ACCOUNT-ACTIVATION.md) · [Movimentações](MOVEMENT-ACCESS.md) · [Investimentos](INVESTMENT-ACCESS.md).
