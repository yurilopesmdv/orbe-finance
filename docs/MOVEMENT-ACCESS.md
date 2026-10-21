# Minhas movimentações

A rota `/my-movements` é acessível por **Seu acesso está pronto → Ver minhas movimentações**, ou pela tela **Minhas contas**. Mantém o layout atual. Esta entrega está preparada localmente; a prévia publicada está identificada em [EXPO-PREVIEW](EXPO-PREVIEW.md).

A leitura real continua desativada. O aviso de preparação não indica erro no seu cadastro nem pede nova autorização no banco. O app não faz consultas financeiras nessa condição.

Quando liberada pelos critérios de [prontidão](RELEASE-READINESS.md), a tela permitirá escolher período, moeda e banco e atualizar manualmente uma conexão. Mostra20movimentos por página, origem/data, direção e estado. Entradas/saídas não são classificadas automaticamente como renda/consumo. Histórico parcial e tipo/categoria não confirmados permanecem explícitos; lista vazia não comprova ausência de movimentos no banco. Cartões, posições de investimento e cofrinhos têm escopo próprio.

Valores e descrições começam ocultos. Os dados lidos ficam somente na memória da sessão protegida e são descartados ao bloquear/sair do primeiro plano/encerrar. Falha de atualização preserva dados anteriores enquanto essa sessão permanece válida. Dados reais não são misturados à demonstração nem enviados aos relatórios demonstrativos.

## Operação técnica

Cliente: `movementReadsEnabled`, `liveIntegrationEnabled` e `privateFinancialDataApproved` precisam de liberação independente; todosfalse nesta versão. Backend: `ORBE_BRIDGE_ENABLED`, `ORBE_MOVEMENT_READS_ENABLED`, `ORBE_PRIVATE_DATA_APPROVED`, codegate e duas chavesbackend distintas32bytes. Novo gate/chaves ainda não provisionados; entrypointpublicado continuaoff.

Rotas preparadas: `POST /movements/read` e `POST /movements/finalize`, com aquisição delease já existente. Leitura recebe somente conexão/revisão/lease/mês/cursor internos. Auth/owner/sessão, consentimentos, bindings e lease precedem fonte; sessão e progresso são revalidados antes da resposta. Cursor interno cifrado, identidadeHMAC e progressoSQL sem valores/cursorbruto. Finalizar requer páginas completas e mesma sessão.

Composição atual fecha o port do provedor após cada página: há uma autenticação técnica por página, sem retry automático ou cache financeiro no servidor. Módulos/fontes e evidências: [TASKS](../tasks/TASKS.md), T22c1–c24. Não usar ferramentasIA/MCP para consultar produção financeira.
