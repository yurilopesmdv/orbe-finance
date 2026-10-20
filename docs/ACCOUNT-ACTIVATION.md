# Ativação conjunta das contas

20/10/2026. Este roteiro fica preparado para a próxima etapa com o titular. Não precisa executar enquanto as pendências técnicas/privacidade abaixo não forem fechadas. Nunca enviar senha, token, número de conta, CPF, itemId ou dados bancários pelo chat.

## Entrega preparada

Login lembrado e proteção de captura/multitarefa confirmados no iPhone. Tela Minhas contas e cadeia técnica de leitura de saldos implementadas com dados inventados: sessão/owner → vínculo privado → lease → chave técnica privada → consentimento atual do proxy → contas exatas → revalidação → cache em memória. Contas correntes/pagamento são a primeira fatia; movimentos, investimentos e cofrinhos reais ainda não estão integrados por esta cadeia. Nada foi conectado ou consentido automaticamente.

## O que depende do titular e do fornecedor

Depois do gate técnico, em seu navegador:

1. Criar/usar sua conta pessoal em [Meu Pluggy](https://meu.pluggy.ai/) e autorizar Bradesco/Mercado Pago pelos fluxos oficiais. Confirmar que a conexão original é Open Finance; não substituir por captura de senha bancária. Autorizar cada instituição separadamente. Não contratar plano.
2. No [Dashboard Pluggy](https://dashboard.pluggy.ai/), com a mesma conta, abrir Applications → aplicação → Demo → Connect Account e escolher **MeuPluggy**. Não selecionar diretamente o banco nem Sandbox nesse passo do proxy.
3. Guardar privadamente o Client ID/Client Secret da aplicação e o item de cada banco mostrado em Connected Items. Não compartilhar pelo chat, não colocar em variável EXPO_PUBLIC nem no .env do app. O local privado e o provisionamento administrativo serão conferidos juntos antes de carregar valores reais.
4. Só após validação do vínculo/consentimento e gates, testar uma conexão por vez no próprio iPhone. Comparação com banco ocorre no aparelho, sem exportar conteúdo para ferramentas, logs ou documentos.

Segundo o [guia pessoal oficial](https://docs.pluggy.ai/en/docs/guides/meu-pluggy-personal-use), o caminho é pessoal/gratuito até cinco conexões, atualiza a origem diariamente e a autorização do proxy é separada da bancária. O guia foi reconferido em20/10/2026; isso não é contrato de disponibilidade ou garantia de privacidade. Não usar listagem global de itens/PATCHrefresh para contornar limites. Autorização renovada pode produzir outro itemId; não sobrescrever vínculo sem revisão.

## O que continua sendo pendência técnica ou externa

| Pendência | Evidência/limite |
|---|---|
| Fornecedor, subprocessadores, retenção, logs, exclusão e origem OF por banco | Revisões T47/T52/T56/T63/T78 permanecem gates; não resolvidas por ter clientId nem por documentação genérica. Proxy MeuPluggy não prova o conector original de cada banco. |
| Dependências/runtime privado | Audit mantém duas raízes altas sem patch,19pacotes, exceção apenas sintética até23/10. JS inspecionado sem essas raízes não homologa toolchain/nativo/fornecedor. Não alterar flags para contornar. |
| Configuração e provisionamento | Nenhuma credencial Pluggy real foi solicitada/carregada; nenhum item/conta reais vinculados. Resolver não cria vínculos por conta própria. Perfis/segredos e comprovantes ficam privados fora Metro. |
| Deploy financeiro | orbe-bridge publicado confirmado v3/literalfalse/503. Boot novo está fixtureOnly e exige transporte injetado; ativação real precisa revisão/versionamento explícitos, não basta uma env. |
| Aceite físico restante | Encerramento/reabertura/logout, VoiceOver, gravação e cache/rede nativos precisam de testes próprios. Retomada/captura/multitarefa já confirmadas não serão perguntadas novamente. |
| Produtos posteriores | Transações, investimentos/cofrinhos reais, suas projeções de fornecedor/paginação/cobertura e histórico permanecem tarefas próprias. Modelos/relatórios demonstrativos não comprovam cobertura real. |

O decoder numérico foi comprovado no Edge gerenciado por função temporária exclusivamente com números inventados e removida após o teste. Isso fecha a capacidade numérica, não os demais gates. [Detalhes de acesso](ACCOUNT-ACCESS.md), [prontidão](RELEASE-READINESS.md) e [estado de retomada](../roadmap/STATE.md).
