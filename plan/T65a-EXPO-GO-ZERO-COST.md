# T65a — caminho sem custos no Expo Go

20/10/2026. PF-08/SEC-09/10/18, AUTH-16. Integrador único, avaliação documental após escolha explícita do titular: não pode pagar por nada agora, manter Expo Go. Não exigir desenvolvimento/build pago como próximo passo, não contratar. T12b já foi publicada e titular confirmou retomada sem senha ao alternar apps.

## Decisão de implementação

Continuar SDK57/Expo Go e senha + token protegido no Keychain. FaceID fica adiado; não mostrar sucesso biométrico fictício. Finanças continuam sintéticas até validar fornecedores/rede/logs/controles no aparelho. Primeira candidata de dados reais: online e memória volátil, sem arquivo/SQLite financeiro nem fallback em nuvem. Isso é direção para testes, não homologação automática de Expo Go para o objetivo de privacidade.

| Controle | Evidência atual | Trabalho restante |
|---|---|---|
| Identidade/sessão | T12b/Keychain device-only e owner/sessão verificados; titular confirmou retomada em primeiro plano | Encerrar processo/reabrir, logout físico, expiração; não inferir teste de30dias |
| FaceID | Limitação oficial do LocalAuthentication57 no Expo Go iOS | Adiado neste runtime, senha/token são o caminho atual |
| Tela/multitarefa | ScreenCapture57 documenta suporte no Go e APIs de captura/app-switcher | T65b1 com sintéticos, prova física antes de conteúdo real; não substituir garantia nativa por overlay JS |
| Persistência financeira | SQLCipher não suportado no Expo Go | Não criar SQLite em claro. Memória somente por enquanto |
| Criptografia futura | Crypto57 documenta AES e inclusão no Expo Go | Nenhum arquivo/chave financeira criado; se necessário, spec própria de nonce/chaves/atomicidade/backup e prova nativa antes de persistir |
| Distribuição | QR remoto próprio funciona; alterações Git/CI/publicação rastreadas | Validar conta/MFA/cadeia de updates e escopo do próprio Expo Go; não certificar binário de terceiro |
| Rede/cache | Gateway limita origem/redirect/cookies/JSON; cache financeiro ainda fixture | Observar runtime sintético no iPhone, revisar cache HTTP nativo e logs gerenciados |

## Implicações de uso

Memória volátil se perde em reinício/bloqueio conforme controller. Reconsultar banco está sujeito ao cooldown15min, atualização diária do proxy e cotas; conteúdo temporariamente indisponível precisa ser explicado sem virar zero. Metas/overrides persistentes e histórico patrimonial exigem contrato de armazenamento antes de prometer conservação entre sessões. Não alterar cooldown/RLS para contornar esse limite.

Não há evidência suficiente para declarar T65 inteira ou T63/T78 concluídos. A avaliação elimina a suposição de que pagar por um build é a única investigação possível; preserva o gate até testes/evidências reais. Se algum requisito não puder ser comprovado gratuitamente, registrar a limitação específica, sem abrir banco para experimentar.

## Próximas microtasks

1. T51b2a: destino/rotas/cursor upstream controlados, fixtures, sem segredo/provedor real.
2. T65b1: proteção de tela nativa e lifecycle com dados inventados, sem nova integração real.
3. T52/T56: matriz de logs/retencão por destino e evidências aplicáveis ao plano pessoal; não tratar ausência de logs próprios como ausência nos provedores.
4. T75/T76/T77: autorização completa/contratos e cobertura sintética; depois gate explícito e homologação pelo titular.

Fontes primárias consultadas20/10/2026: [LocalAuthentication57](https://docs.expo.dev/versions/v57.0.0/sdk/local-authentication/), [ScreenCapture57](https://docs.expo.dev/versions/v57.0.0/sdk/screen-capture/), [SQLite/SQLCipher57](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/#sqlcipher), [Crypto57](https://docs.expo.dev/versions/v57.0.0/sdk/crypto/). SecureStore57.0.4 conferido no código/pacote instalado e native adapter em testes; URL pública57 retornou indisponível, não substituir por SDK58 na implementação.
