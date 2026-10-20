# Proteção de tela no iPhone

T65b1 adiciona prevenção nativa de captura/gravação e proteção da prévia na multitarefa pelo módulo ScreenCapture57.0.4, incluído no Expo Go SDK57. Não é FaceID e não solicita permissão para fotos. O visual normal do Orbe é preservado.

Antes de mostrar login, ativação, acesso ou conexões, o Orbe aguarda a confirmação das APIs nativas. Na preparação, falha ou segundo plano, o conteúdo dessas telas não é montado; aparece uma mensagem neutra. Falha após5s permite tentar novamente ou explorar os dados inventados. O roteador sempre monta normalmente, evitando repetir o erro anterior de inicialização.

A proteção nativa fica ativa durante a experiência Orbe, inclusive a demonstração. Chaves de montagem e fila serial evitam que a limpeza de uma montagem antiga libere captura de outra. Sem outro dono, a limpeza tenta liberar a chave/blur. O módulo iOS instalado também restaura seu canvas e remove a proteção de app-switcher em OnDestroy; revisão de código não substitui teste físico. Operações nativas que não retornam podem exigir fechar/reabrir o Expo Go; telas privadas continuam bloqueadas enquanto isso.

## Teste físico final, somente com conteúdo inventado

1. Abra o QR da prévia com T65b1. O acesso lembrado deve continuar funcionando. Não recrie a conta.
2. Na tela “Seu acesso está pronto”, sem senha/e-mail visíveis, faça uma captura local e veja se o conteúdo do Orbe fica protegido. Não envie a imagem pelo chat.
3. Alterne para outro app e veja se a prévia do Orbe na multitarefa fica protegida. Ao voltar, a sessão deve retomar online.
4. Informe apenas o resultado genérico. Gravação, encerramento do processo e diferentes versões de iOS precisam de testes próprios; não inferir aprovação universal a partir de uma captura.

Não há proteção contra câmera externa ou sistema/aplicativo comprometido. Sucesso da API/mocks não certifica captura física, controle de todo Expo Go ou ausência de telemetria do fornecedor. O controle ainda não autoriza buscar dados bancários reais. A futura composição financeira precisa validar readiness também antes de buscar/promover conteúdo, além da tela.

SEC-25 e [plano](../plan/T65b1-SCREEN-PROTECTION.md). [Fonte SDK57](https://docs.expo.dev/versions/v57.0.0/sdk/screen-capture/). Screenshots event listeners, biblioteca de fotos, logs e uploads não são usados pelo Orbe para esse controle.
