# Ativação bancária: revisão objetiva de20/10/2026

**Pesquisa histórica da c14, preservada para rastreabilidade.** Estado operacional vigente em [prontidão](../RELEASE-READINESS.md) e [ativação](../ACCOUNT-ACTIVATION.md): credenciais autenticadas/configuradas no backend desligado, bridge v5/metadata v4 e um vínculo MPpending, sem contas/valores coletados. O titular já conectou os bancos no portal pessoal; as instruções de preparação abaixo não devem ser repetidas.

T51b2c14/MPG-29. Pesquisa pública e auditoria de dependências; nenhum acesso a conta bancária, login no fornecedor, contato enviado, contrato ou consentimento. A conta pessoal vazia e as credenciais técnicas podem ser preparadas pelo titular; autorização bancária e leitura real do Orbe permanecem pendentes.

## Bloqueios revalidados

| Parte | Evidência atual | Consequência |
|---|---|---|
| braces3.0.3/tooling | [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm): DoS por padrões aninhados, versões<=3.0.3, sem versão corrigida publicada no advisory | Não há upgrade oficial deste pacote a aplicar para fechar esse alerta hoje. Não manipular auditoria ou usar downgrade incompatível. |
| node-forge1.4.0/tooling | [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv): verificação RSA incompleta, versões<=1.4.0, sem versão corrigida no advisory | Precisar de correção compatível ou mitigação de alcance/release revisada para uso real; exceção sintética não serve. |
| Árvore Orbe | npm audit atual confirma19afetados altos/0críticos, as mesmas2raízes; propostas automáticas são downgrades major Expo44.0.6/expo-updates0.11.7 | Não instalar esses downgrades contra SDK57. ExportiOS inspecionado1201fontes/56instâncias não contém ambas raízes; isso não certifica ferramentas/nativo/distribuição. |
| Meu Pluggy/fornecedor | [Guia pessoal](https://docs.pluggy.ai/en/docs/guides/meu-pluggy-personal-use) confirma fluxo gratuito e separação do proxy; [política pública](https://www.pluggy.ai/legal) prevê parceiros/processamento internacional e exclusão com exceções | Divulgação pública não identifica integralmente os operadores, payloads de logs e prazos de backup aplicáveis ao plano pessoal. Não concluir isolamento de IA ou riscozero por ausência de notícia. |

São alertas nas ferramentas do Orbe e lacunas de comprovação contratual/operacional, não evidência de incidente bancário do titular. Backendfinanceiro continuaoff; nenhuma credencialPluggyreal configurada. A inspeção JS e testes são evidências com escopo definido, não aprovação universal.

## Pontos que a documentação pública esclarece

O [guia de segurança da Pluggy](https://www.pluggy.ai/blog/seguranca-open-finance-api) distingue autenticação no banco em conectores Open Finance de credencial guardada por conectores diretos; também declara exclusão da conexão e alerta sobre logs e chaves frontend. Declarações do fornecedor não substituem verificação da origem de Bradesco/MercadoPago nem detalham retenção de todos os backups. O proxy MeuPluggy carrega conexões anteriores; sua etiqueta Direct não prova que a conexão bancária original também seja Direct.

No [Dashboard](https://docs.pluggy.ai/en/docs/guides/dashboard-connectors), ClientID aparece em Applications e ClientSecret só é exibido ao criar/gerar novo; gerar outro invalida o anterior. Preparar essas credenciais não exige ler saldos no Orbe. Não selecionar ConnectAccount/autorizar banco enquanto etapa real não for liberada.

## Perguntas preparadas, nenhum contato enviado

Aplicar especificamente ao Meu Pluggy pessoal gratuito e ao proxy de aplicação demo, sem incluir dados do titular:

1. Quais subprocessadores e países recebem conteúdo financeiro, metadados e logs em cada etapa?
2. Alguma função de IA/MCP/enriquecimento/analytics recebe dados automaticamente sem ativação explícita? Como verificar a separação?
3. Qual o conteúdo e o prazo de retenção dos logs de API/erros, inclusive item/accountIDs em URL? Há captura de bodies/headers?
4. Quais os prazos de exclusão de dados ativos e backups após apagar conexão/conta? Quais exceções continuam aplicáveis?
5. Como confirmar no fluxo pessoal a origem OpenFinance do Bradesco/MercadoPago sem disponibilizar senha bancária ao conector direto?
6. Qual evidência de auditoria/controle de acesso operacional é aplicável ao plano pessoal, inclusive suporte e incidentes?

As respostas externas não podem ser fabricadas nem substituídas por mais fixtures. Não enviar mensagem ao fornecedor sem instrução do titular. [Roteiro do titular](../ACCOUNT-ACTIVATION.md) e [estado](../../roadmap/STATE.md).
