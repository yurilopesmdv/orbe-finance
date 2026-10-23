# Minhas movimentações

**VigenteT81:** após leituras autorizadas, cache financeiro é criptografado somente no iPhone e preservado ao fechar; memória continua purgada ao bloquear/background, logout/clear eliminam chave/arquivos. Automação e critérios em [AUTOMATIC-WALLET](AUTOMATIC-WALLET.md); afirmações anteriores de memória exclusiva são históricas.

A rota `/my-movements` é acessível por **Seu acesso está pronto → Ver minhas movimentações**, ou pela tela **Minhas contas**. Mantém o layout atual. Esta entrega está preparada localmente; a prévia publicada está identificada em [EXPO-PREVIEW](EXPO-PREVIEW.md).

A leitura pessoal está habilitada e é carregada automaticamente pela home na préviaT77. Prepare e ative a conexão pela sua sessão, conforme [ativação](ACCOUNT-ACTIVATION.md). Mercado Pago tem origem e permissões comprovadas; Bradesco ainda sem proxy próprio. Primeiro movimento real no iPhone ainda não confirmado.

Conforme os critérios de [prontidão](RELEASE-READINESS.md), a tela permite escolher período, moeda e banco e atualizar manualmente uma conexão. Mostra20movimentos por página, origem/data, direção e estado. Entradas/saídas não são classificadas automaticamente como renda/consumo. Histórico parcial e tipo/categoria não confirmados permanecem explícitos; lista vazia não comprova ausência de movimentos no banco. Cartões, posições de investimento e cofrinhos têm escopo próprio.

Valores e descrições começam ocultos. Os dados lidos ficam somente na memória da sessão protegida e são descartados ao bloquear/sair do primeiro plano/encerrar. Falha de atualização preserva dados anteriores enquanto essa sessão permanece válida. Dados reais não são misturados à demonstração nem enviados aos relatórios demonstrativos.

## Operação técnica

Cliente: `movementReadsEnabled`, `liveIntegrationEnabled` e `privateFinancialDataApproved` precisam de liberação independente; habilitados na liberação pessoal atual. Backend: `ORBE_BRIDGE_ENABLED`, `ORBE_MOVEMENT_READS_ENABLED`, `ORBE_PRIVATE_DATA_APPROVED`, codegate e duas chavesbackend distintas32bytes. Chaves provisionadas e digests conferidos; ORBE_OWNER_LIVE_RELEASE é o kill switch independente.

Rotas preparadas: `POST /movements/read` e `POST /movements/finalize`, com aquisição delease já existente. Leitura recebe somente conexão/revisão/lease/mês/cursor internos. Auth/owner/sessão, consentimentos, bindings e lease precedem fonte; sessão e progresso são revalidados antes da resposta. Cursor interno cifrado, identidadeHMAC e progressoSQL sem valores/cursorbruto. Finalizar requer páginas completas e mesma sessão.

Composição atual fecha o port do provedor após cada página: há uma autenticação técnica por página, sem retry automático ou cache financeiro no servidor. Módulos/fontes e evidências: [TASKS](../tasks/TASKS.md), T22c1–c24. Não usar ferramentasIA/MCP para consultar produção financeira.


## Histórico: intervalo compartilhado antes daT77

O intervalo atual é de15minutos por conexão bancária e é compartilhado entre saldos, movimentações e investimentos. Atualizar saldos não carrega automaticamente as movimentações; a leitura seguinte pode receber a mensagem de intervalo antes de chamar a Pluggy. O titular confirmou saldo funcionando e essa mensagem ao tentar movimentos; o diagnóstico técnico confirmou leitura de contas concluída e nenhum lote de movimentos iniciado. Aguarde a liberação e atualize o período desejado na tela de movimentações. Não é necessário reativar o banco ou alterar credenciais. Um cooldown válido após leitura bem-sucedida não deve ser removido como correção administrativa de falha.


## Direção atualT77

A home sincroniza mêsatual/anterior automaticamente, exibe5maisrecentes e Ver todas abre o período correspondente. A tela usa o mesmo cache da home e mantém dados ao navegar. Intervalo30s porproduto, sem bloquear produtos diferentes; leaseúnica porbanco, fila comum, purge ao background/logout/lock preservados. Versões e QR atuais em EXPO-PREVIEW e funcionamento em FINANCIAL-HOME. O texto de intervalo900s acima é histórico declientesantigos.
