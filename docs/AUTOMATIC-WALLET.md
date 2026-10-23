# Carteira automática no iPhone

23/10/2026, SPEC012/T81. O titular autorizou cache financeiro protegido no dispositivo e atualizações automáticas, inclusive preparação das conexões já aceitas no banco. Isso substitui a exigência anterior de apagar também qualquer cópia local ao fechar.

## Uso

Abra o Orbe com seu acesso existente. Após validar a sessão e os vínculos atuais, o app restaura os dados do cache protegido e verifica a necessidade de leitura. As conexões pendentes já aceitas no banco são preparadas e ativadas pela sessão do titular, sem outra confirmação Orbe. Bancos pausados, revogados ou com consentimento vencido não são reativados automaticamente.

Para incluir Nubank ou outro banco suportado, toque **Adicionar banco** na home ou em Conexões. O app abre exclusivamente o conector Meu Pluggy200. Entre na mesma carteira pessoal em que já autorizou os bancos e selecione a conexão. O identificador chega ao Orbe automaticamente pelo callback, sem arquivo, chat ou cópia manual. O backend valida o fluxo e a origem Open Finance, cadastra o banco e a home prepara/atualiza seus dados.

Se o provedor ainda estiver processando, use **Tentar concluir conexão**. Fechar essa tela antes do callback pode impedir o cadastro; reabra a adição. O fluxo tem prazo de30min e exige a mesma sessão autenticada; uma sessão expirada precisa ser retomada. A seleção autorizada no Meu Pluggy não é uma permissão para conectar diretamente um conector bancário pago.

## O que é automático e o que depende da fonte

O app verifica vínculos ao abrir/retomar, mantém resultados recentes e faz atualização periódica a cada15min em primeiro plano. Uma revisão/datafonte diferente invalida a validade local; erro/consulta ausente tem retentativa limitada. A janela de validade também determina nova leitura mesmo quando o metadado armazenado ainda não mudou: a data no Orbe não é um feed de alterações do banco. Não há comparação item-a-item por uma API inexistente nem promessa de atualização bancária em tempo real. O Meu Pluggy documenta sincronização diária; consultar o proxy não força sincronização bancária.

O [guia pessoal](https://meu.pluggy.ai/api-guide) e [FAQ](https://docs.pluggy.ai/en/docs/get-started/faq) não permitem listar itens no plano pessoal. Assim, um banco adicionado fora do Orbe ainda precisa ser selecionado na tela Adicionar banco; o Orbe não pode avisar retroativamente que descobriu um identificador desconhecido. A partir do fluxo interno, recebe e guarda seu vínculo automaticamente.

## Cache e proteção

- Somente no iPhone: AES256GCM nativo, nonce novo por gravação, chave no Keychain com senha de desbloqueio obrigatória e THIS_DEVICE_ONLY. Sem fallback em claro. Ciphertext em dois arquivos de cache; gravação no slot inativo e troca do ponteiro só após terminar. Cada envelope fica limitado a4MiB e expira em30dias; o iOS pode remover cache por espaço.
- Projeto e identidade autenticada participam da autenticação criptográfica. O cache não contém senha, JWT, refresh token ou segredo Pluggy. Os dados continuam fora do Supabase e de logs/telemetria/exportações.
- Ao fechar/background, a memória é limpa e as consultas abortadas; o arquivo criptografado permanece. Depois de autenticar, somente bancos/revisões/produtos ainda permitidos são restaurados. Sem acesso aos dados na tela de login nem promessa de desbloqueio offline.
- **Sair da conta** apaga chave e arquivos. **Apagar cache deste iPhone e bloquear** também limpa a cópia local. Uma escrita anterior não pode recriar o cache após essa exclusão. Falha de armazenamento mantém consulta online e apresenta aviso; não migra para plaintext.
- Captura de tela/multitarefa continuam protegidas. A execução em Expo Go não é uma garantia de riscozero, nem prova de ausência de coleta interna pelo fornecedor. Cache e integração nativos precisam de aceite no aparelho após publicação.

## Protocolo de conexão

Backend emite Connect Token de30min e ticket técnico privado vinculado a owner/sessão. `options.clientUserId` recebe apenas UUID aleatório do fluxo. Callback é dado não confiável: o servidor busca metadados do item, compara clientUserId, valida proxy→consentimento único→origemOF603/606/612 e reautentica antes de registrar. Fluxo expirado/alheio, conector direto/sandbox ou troca silenciosa de um banco ativo por outro item é recusada. Banco existente com mesmo vínculo é idempotente. Nenhuma chave administrativa vai ao WebView.

Tela usa protocolo do SDK nativo oficial1.6.0 revisado, com navegação HTTPS limitada a Pluggy/MeuPluggy e provedores de login reconhecidos no fluxoOAuth, sem logar mensagens/URLs. Cookies de autenticação da tela do fornecedor são distintos do cache financeiro do Orbe; o app não lê/scrapeia cookies nem credenciais bancárias. Não há webhook, cron ou coleta financeira com o app fechado nesta entrega.

Migration20 adiciona Nubank e tickets técnicos; as19 anteriores permanecem imutáveis. Cartões/faturas continuam no planoT80, sem ativação por esta entrega. Cofrinhos e investimentos dependem do que a fonte retornar, sem valores estimados ou dupla contagem.
