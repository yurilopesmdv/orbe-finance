# Abrir o Orbe no Expo Go

Prévia iOS publicada20/10/2026, SDK57, sem PC/Metro/Wi-Fi local. Entre no Expo Go com a conta proprietária do projeto e escaneie:

![QR com sessão lembrada e proteção de tela](assets/orbe-expo-go-20261020.png)

Link direto: exp://u.expo.dev/update/01a15a30-9dfd-773a-ba38-2c283d4cd2bd

Projeto EAS69843dfe-ab1b-469e-bb78-c7948bbf1d9b · preview · runtimeexposdk:57.0.0 · update01a15a30-9dfd-773a-ba38-2c283d4cd2bd · grupo2cfdc1b2-412b-4f30-b3c4-6d751a196f71 · commite2bfeaa.

**Já criou seu acesso:** entre uma vez nesta versão com **Manter meu acesso neste iPhone** ligado. A versão anterior não guardava refresh token, portanto esse primeiro login é necessário. Depois, o Orbe retoma online sem pedir senha a cada retorno, por até30dias. Não precisa recriar conta nem gerar código. [Como funciona e como sair](REMEMBERED-ACCESS.md).

**Ainda não criou seu acesso:** toque em Criar meu acesso e siga [a ativação privada](OWNER-ACCESS.md). Código temporário só no arquivo privado local, nunca no QR/chat/Git. Outros cadastros continuam desabilitados.

710 testes/typechecks/export/CI aprovados ([execução](https://github.com/yurilopesmdv/orbe-finance/actions/runs/39459277303)). Manifesto remoto confere schemeorbe e hash do launchAsset igual ao HBC local. Smoke refresh/rotação/logout com identidade fictícia passou e identidade foi removida. Titular confirmou retomada sem senha após alternar apps no iPhone; encerramento/reabertura do processo e logout físico ainda não testados; funcionamento relatado de prévias anteriores não homologa esse novo controle.

Disponível: demonstração de gastos/carteira/metas/relatórios, ativação/login/sessão lembrada e metadados de conexões. Senha não é persistida. Open Finance real, Face ID e recuperação por e-mail continuam desabilitados. Titular manteve Expo Go/orçamento zero; nenhum serviço contratado. Cores/identidade visual ficam posteriores. [Prontidão e gates](RELEASE-READINESS.md).

**Proteção de tela T65b1:** captura/gravação e prévia na multitarefa são protegidas pelo módulo nativo. Telas privadas ficam ocultas se a preparação falhar ou enquanto o app está inativo; a demonstração continua acessível. Teste físico sintético solicitado ao titular após esta publicação; APIs/testes não provam resultado no aparelho. [Roteiro](SCREEN-PROTECTION.md).
