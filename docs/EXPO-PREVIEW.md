# Abrir o Orbe no Expo Go

Prévia iOS publicada20/10/2026, SDK57, sem PC/Metro/Wi-Fi local. Entre no Expo Go com a conta proprietária do projeto e escaneie:

![QR com sessão lembrada](assets/orbe-expo-go-20261020.png)

Link direto: exp://u.expo.dev/update/01a15971-ed8f-7228-908b-945be1207249

Projeto EAS69843dfe-ab1b-469e-bb78-c7948bbf1d9b · preview · runtimeexposdk:57.0.0 · update01a15971-ed8f-7228-908b-945be1207249 · grupoc5625e52-6247-4f47-8889-a8f4b0eb31a3 · commiteb9c865.

**Já criou seu acesso:** entre uma vez nesta versão com **Manter meu acesso neste iPhone** ligado. A versão anterior não guardava refresh token, portanto esse primeiro login é necessário. Depois, o Orbe retoma online sem pedir senha a cada retorno, por até30dias. Não precisa recriar conta nem gerar código. [Como funciona e como sair](REMEMBERED-ACCESS.md).

**Ainda não criou seu acesso:** toque em Criar meu acesso e siga [a ativação privada](OWNER-ACCESS.md). Código temporário só no arquivo privado local, nunca no QR/chat/Git. Outros cadastros continuam desabilitados.

686 testes/typechecks/export/CI aprovados ([execução](https://github.com/yurilopesmdv/orbe-finance/actions/runs/39428239529)). Manifesto remoto confere schemeorbe e hash do launchAsset igual ao HBC local. Smoke refresh/rotação/logout com identidade fictícia passou e identidade foi removida. O teste do Keychain/retomada real no iPhone aguarda retorno do titular; funcionamento relatado de prévias anteriores não homologa esse novo controle.

Disponível: demonstração de gastos/carteira/metas/relatórios, ativação/login/sessão lembrada e metadados de conexões. Senha não é persistida. Open Finance real, Face ID e recuperação por e-mail continuam desabilitados. Titular manteve Expo Go/orçamento zero; nenhum serviço contratado. Cores/identidade visual ficam posteriores. [Prontidão e gates](RELEASE-READINESS.md).
