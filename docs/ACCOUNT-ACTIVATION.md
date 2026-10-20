# Ativação conjunta das contas

20/10/2026. Você já pode preparar seu cadastro vazio e as credenciais técnicas, sem conectar bancos. Autorizações bancárias e leitura pelo Orbe continuam aguardando os bloqueios abaixo. Nunca enviar senha, token, número de conta, CPF, itemId ou dados bancários pelo chat.

## Entrega preparada

Login lembrado e proteção de captura/multitarefa confirmados no iPhone. Tela Minhas contas e cadeia técnica de leitura de saldos implementadas com dados inventados: sessão/owner → vínculo privado → lease → chave técnica privada → consentimento atual do proxy → contas exatas → revalidação → cache em memória. Contas correntes/pagamento são a primeira fatia; movimentos, investimentos e cofrinhos reais ainda não estão integrados por esta cadeia. Nada foi conectado ou consentido automaticamente.

## Você pode preparar agora, sem bancos

1. Acesse [Meu Pluggy](https://meu.pluggy.ai/) e crie sua conta pessoal ou faça login. Por enquanto não escolha conectar/autorizar banco.
2. Abra o [Dashboard Pluggy](https://dashboard.pluggy.ai/) com a mesma conta. Entre em **Applications** e abra a aplicação que será usada para o Orbe. Se precisar criar uma aplicação, use nome Orbe e mantenha o caminho pessoal/gratuito; não contrate plano.
3. Copie o **Client ID** mostrado em Applications. O **Client Secret** aparece apenas ao criar a aplicação ou em **Generate new secret** na página dela. Guarde-o no momento em que for exibido; gerar outro invalida o anterior. [Instrução oficial de credenciais](https://docs.pluggy.ai/en/docs/guides/dashboard-connectors).
4. Preencha somente os dois campos que já estão no arquivo privado `/home/yurilopesm/.config/orbe-finance/pluggy.env`: `PLUGGY_CLIENT_ID=` e `PLUGGY_CLIENT_SECRET=`. Cole os valores depois do sinal de igual, sem aspas, preservando o restante. Não envie nenhum deles no chat, não use EXPO_PUBLIC e não coloque no .env do app.
5. Pare nessa preparação. Ainda não selecione **Connect Account**, não autorize banco e não ative integração com IA/MCP. O preflight local verifica formato/permissões, sem consultar o fornecedor ou saldos.

Essa etapa não ativa a leitura no Orbe. Os bloqueios atuais e fontes reconferidas estão em [revisão objetiva](security/ACTIVATION-BLOCKERS-20261020.md).

## O que depende do titular e do fornecedor

Depois do gate técnico, em seu navegador:

1. Criar/usar sua conta pessoal em [Meu Pluggy](https://meu.pluggy.ai/) e autorizar Bradesco/Mercado Pago pelos fluxos oficiais. Confirmar que a conexão original é Open Finance; não substituir por captura de senha bancária. Autorizar cada instituição separadamente. Não contratar plano.
2. No [Dashboard Pluggy](https://dashboard.pluggy.ai/), com a mesma conta, abrir Applications → aplicação → Demo → Connect Account e escolher **MeuPluggy**. Não selecionar diretamente o banco nem Sandbox nesse passo do proxy.
3. Guardar privadamente o Client ID/Client Secret da aplicação e somente os itens efetivamente disponíveis na demo. A tela de detalhe pode estar filtrada por itemId na URL; ela não prova que todos os itens da aplicação estão visíveis. Não compartilhar pelo chat, não colocar em variável EXPO_PUBLIC nem no .env do app. O arquivo privado vazio já foi preparado em `/home/yurilopesm/.config/orbe-finance/pluggy.env` (0700 no diretório/0600 no arquivo), somente `PLUGGY_CLIENT_ID=` e `PLUGGY_CLIENT_SECRET=`. Preenchimento fica para a etapa conjunta após os gates, sem enviar valores pelo chat. O provisionamento dos vínculos será conferido antes de carregar valores reais.
4. Só após validação do vínculo/consentimento e gates, testar uma conexão por vez no próprio iPhone. Comparação com banco ocorre no aparelho, sem exportar conteúdo para ferramentas, logs ou documentos.

Segundo o [guia pessoal oficial](https://docs.pluggy.ai/en/docs/guides/meu-pluggy-personal-use), o caminho é pessoal/gratuito até cinco conexões, atualiza a origem diariamente e a autorização do proxy é separada da bancária. O guia foi reconferido em20/10/2026; isso não é contrato de disponibilidade ou garantia de privacidade. Não usar listagem global de itens/PATCHrefresh para contornar limites. Autorização renovada pode produzir outro itemId; não sobrescrever vínculo sem revisão.

## O que continua sendo pendência técnica ou externa

| Pendência | Evidência/limite |
|---|---|
| Fornecedor, subprocessadores, retenção, logs, exclusão e origem OF por banco | Revisões T47/T52/T56/T63/T78 permanecem gates; não resolvidas por ter clientId nem por documentação genérica. Proxy MeuPluggy não prova o conector original de cada banco. |
| Dependências/runtime privado | Audit mantém duas raízes altas sem patch,19pacotes, exceção apenas sintética até23/10. JS inspecionado sem essas raízes não homologa toolchain/nativo/fornecedor. Não alterar flags para contornar. |
| Configuração e provisionamento | Credenciais técnicas locais têm formato/permissões validados; nenhum item/conta reais vinculado ao Orbe. Resolver não cria vínculos por conta própria. Perfis/segredos e comprovantes ficam privados fora Metro. |
| Deploy financeiro | orbe-bridge publicado confirmado v3/literalfalse/503. Boot novo está fixtureOnly e exige transporte injetado; ativação real precisa revisão/versionamento explícitos, não basta uma env. |
| Aceite físico restante | Encerramento/reabertura/logout, VoiceOver, gravação e cache/rede nativos precisam de testes próprios. Retomada/captura/multitarefa já confirmadas não serão perguntadas novamente. |
| Produtos posteriores | Transações, investimentos/cofrinhos reais, suas projeções de fornecedor/paginação/cobertura e histórico permanecem tarefas próprias. Modelos/relatórios demonstrativos não comprovam cobertura real. |

O decoder numérico foi comprovado no Edge gerenciado por função temporária exclusivamente com números inventados e removida após o teste. Isso fecha a capacidade numérica, não os demais gates. [Detalhes de acesso](ACCOUNT-ACCESS.md), [prontidão](RELEASE-READINESS.md) e [estado de retomada](../roadmap/STATE.md).

Preflight local: `PYTHONDONTWRITEBYTECODE=1 python3 scripts/provider-profile.py check`. Só valida formato/permissões e informa readiness, nunca exibe valores ou chama o fornecedor. Init não sobrescreve perfil existente. Credencial válida não comprova autorização bancária nem libera gates.

Atualização20/10: titular preencheu ClientID/Secret; preflight local aprovou somente formato e permissões (credentials_configuredtrue), sem autenticar na API/provedor_calls0. Não é prova de validade remota nem liberação real. A APIkey exibida no Dashboard não precisa ser adicionada ao perfil; a porta backend fará a troca técnica autorizada e manterá a chave temporária só em memória. O fluxo bancário oficial continua em duas etapas: autorização original no MeuPluggy e proxyMeuPluggy na aplicação demo, conforme instruções acima.

### Aviso “Testar com dados reais — solicitação pendente”

Titular confirmou que o aviso aparece em dashboard.pluggy.ai/overview. O guia oficial pessoal afirma que o caminho Meu Pluggy + conectorMeuPluggy não exige liberação de dados reais do Dashboard/due diligence comercial. Isso não comprova que a solicitação individual será aprovada nem que toda UI esteja liberada. Conexão bancária original fica no portal meu.pluggy.ai; depois Applications→aplicação→Demo→ConnectAccount→MeuPluggy. Se necessário, Customization→Connectors→Personal→DirectConnectors habilitaMeuPluggy. Não escolher o conector direto do banco no Dashboard para contornar aprovação. Bloqueio do próprio MeuPluggy divergiria do guia e precisa de esclarecimento do fornecedor. Roteiro não libera gates do Orbe. Fontes reconferidas: https://meu.pluggy.ai/api-guide e https://docs.pluggy.ai/pt/docs/guides/meu-pluggy-personal-use .

### Progresso confirmado pelo titular —20/10/2026

Bradesco e Mercado Pago adicionados no portal pessoal; titular confirmou depois a importação na aplicação demo de desenvolvimento. Não é necessário repetir a criação das conexões. Esse relato não comprova mapeamento privado por banco, origem Open Finance, cobertura dos produtos ou leitura pelo Orbe. Nenhum valor financeiro foi consultado pelas ferramentas. Próxima etapa técnica: provisionamento privado com identificação mínima, sem itemIds no chat, seguido de revisão do boot/deploy e gates existentes.

Inventário técnico privado versão2 em `/home/yurilopesm/.config/orbe-finance/pluggy-items.json`: lista de itens observados, sem exigir dois IDs. Um item configurado não comprova cobertura de dois bancos. O identificador enviado pelo titular foi registrado exclusivamente nesse arquivo privado, associado ao Mercado Pago conforme detalhe apresentado, sem copiar o valor para Git/documentação. Bradesco permanece confirmado no portal de origem, mas seu item na aplicação ainda não foi identificado. Não duplicar o ID existente nem refazer consentimentos bancários. `python3 scripts/provider-items.py check` informa apenas contagem/formato, sem rede ou conteúdo.

Staging backend preparado: RPC privilegiada cadastra somente conexão `pending` e binding técnico privado; não atribui aprovação Open Finance nem capacidades, não cria contas e não ativa leitura. Migration9 e testes SQL fictícios com rollback aprovados. O cadastro efetivo ainda depende do aplicador privado e do inventário preenchido; o titular não precisa executar SQL ou configurar o backend.

Atualização c18: o vínculo técnico do Mercado Pago fornecido pelo titular foi cadastrado no Supabase próprio exclusivamente como `pending`, sem contas, capacidades ou aprovação OF. Checagem agregada booleana confirmou o estado. Não houve chamada à Pluggy nem leitura financeira. Não é necessário reenviar o identificador ou editar o inventário deste item; o aplicador fica sob responsabilidade da implementação. Bradesco continua confirmado na origem e sem item identificado na aplicação.

Camada de rede preparada e testada com transporte fictício: somente operações de autenticação/lease/resolver do Supabase próprio e Auth/item/contas da Pluggy; recusa outros destinos, credenciais cruzadas, cookies e redirecionamento. Não está conectada ao entrypoint publicado e não altera o estado pendente ou libera leitura. Próxima etapa de provisionamento deve obter IDs mínimos das contas exclusivamente no backend, sem pedir que o titular copie números de conta e sem disponibilizar páginas financeiras às ferramentas.

Projeção mínima de inventário de contas preparada em fixtures: extrai IDs técnicos e moeda, sem ler valores, número da conta ou titular. Não faz rede nem registra contas por conta própria. A criação atômica dos bindings e o fluxo autorizado de descoberta continuam etapas técnicas seguintes; o titular não precisa copiar IDs de contas.

Publicação c31: orbe-bridgev4 com rootunificado de leitura/descoberta, mas liveApprovedfalse no código.7verificações503/no-store e canários privados aprovados; nenhum saldo/conta do fornecedor consultado. Cliente de descoberta é a próxima fatia; a publicação backend não altera o QR nem libera leituras no app.

Atualização c34: ClientID/Secret foram autenticados com sucesso exclusivamente em POST/auth. A chave temporária foi validada em memória, não foi exibida/salva nem usada para consultar item/conta/valores. Isso confirma o par técnico, não cobertura/titularidade/OF ou ativação; total1chamadaAuthreal/0leiturasfinanceiras pelas ferramentas. Não é necessário reenviar as credenciais.

Configuração c36 concluída: credenciais técnicas guardadas somente em segredos do backend próprio e quatro flags financeiras confirmadas false por digest. Nenhuma chave em variável EXPO_PUBLIC. Supabase incrementou versões automaticamente para bridge5/metadata4; downloadread-only comprovou código inalterado por hashes, e7smokes503/5negativosmetadata passaram. A configuração está pronta para a etapa de liberação após revisões, sem consulta financeira. Nenhuma edição de painel é necessária do titular agora.
