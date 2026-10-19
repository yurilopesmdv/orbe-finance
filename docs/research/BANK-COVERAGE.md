# Matriz de cobertura e homologação bancária

**Revisão vigente 0.4:** [SPEC-009](../../specs/009-meu-pluggy/spec.md) seleciona Meu Pluggy para integração automática Bradesco/Mercado Pago PF. [Plano vigente](../../plan/MEU-PLUGGY.md). Esta revisão prevalece sobre escolhas conflitantes abaixo; Open Finance é a única origem financeira admitida. Pesquisa pública permite seguir no planejamento, sem aprovação de dados reais.

> Revisão vigente: todas as contas são PF confirmadas; prioridade inicial agora é Bradesco e Mercado Pago. Inter/Nubank ficam em expansão. A matriz abaixo preserva a investigação de agregador; [APIs PF](PERSONAL-ACCOUNTS.md) registra a rota direta, ainda sem comprovação de acesso gratuito completo.

Prioridade informada: Mercado Pago, Bradesco, Inter e Nubank. Uso pessoal gratuito. Data: 16/10/2026. Status de todos: **não homologados**. Nenhuma conta foi conectada durante o planejamento.

| Banco PF a confirmar | Contas/extrato: documentação OF | Investimentos: documentação OF | Cofrinhos/nomes/metas | Dados reais no Orbe | Ordem de validação proposta |
|---|---|---|---|---|---|
| Nubank | Listado | Listado; validar instrumento real | Representação e nomes a confirmar | Não testados | Expansão |
| Inter | Listado | Listado; validar instrumento real | Produtos utilizados a informar | Não testados | Expansão |
| Mercado Pago | Listado | Listado; validar instrumento real | Campos e inclusão no saldo a confirmar | Não testados | 1 — prioridade PF |
| Bradesco | Listado | Listado; validar instrumento real | Produtos utilizados a informar | Não testados | 2 — prioridade PF |

“Listado” vem da [cobertura oficial de instituições](https://docs.pluggy.ai/en/docs/open-finance/institutions-coverage). A tabela agrega contextos: não é homologação do conector pessoal ou do proxy. A ordem é hipótese operacional para exercitar riscos, não prioridade financeira recomendada nem preferência expressa do usuário. É ajustável conforme contas disponíveis.

## Ficha a completar para cada banco na task correspondente

- Data, ambiente, versão do adaptador e responsável; evidência sanitizada, sem números de conta/CPF/segredos em Git.
- Tipo PF/PJ, instituição e ID do conector original; trilha de autorização Open Finance comprovada ou pendente; item proxy registrado apenas na configuração privada do backend.
- Recursos efetivos do consentimento: contas, transações, investimentos e reservas; paginação/período histórico disponível.
- Campos de saldo: livre/total/reservado/automaticamente aplicado; unidade, moeda e data; relação entre cada campo e ativo subjacente.
- Investimentos presentes, posições sem valor, bruto/líquido, tipos não suportados; nenhuma ausência transformada em zero.
- Cofrinhos/caixinhas usados pelo proprietário: nome disponível ou não; posição única, múltiplas posições ou reserva dentro da conta; prova de que não duplicam ativos.
- Datas da fonte/importação, comportamento de atualização/reautorização/revogação e eventuais restrições comerciais.
- Resultado: homologado, parcial com limitação conhecida ou bloqueado; requisito afetado, alternativa e próxima ação.

## Gate de aceitação

Banco só recebe homologado após comparação privada com saldo/extrato na fonte, identidade/ownership, repetição de sync sem duplicidade e comportamento seguro de revogação. Diferenças temporais precisam de justificativa de data, não tolerância numérica genérica. Não anexar extratos reais ao repositório. R2 exige as fichas Bradesco/Mercado Pago e cobertura por produto explicitamente aceita; um banco ausente não deve ser marcado como concluído.

Pesquisa T03 concluída: [evidência e limitações](../../plan/T03-PERSONAL-FEASIBILITY.md). Origem Open Finance dos bancos no Meu Pluggy pessoal não comprovada por tabela comercial; não habilitar dados reais antes dessa prova.

## Revisão19/10/2026 — autorização antes de coleções

O [guia pessoal](https://docs.pluggy.ai/en/docs/guides/meu-pluggy-personal-use) distingue prazo anual do proxy e consentimento do banco: proxy expirado pode retornar listas vazias com último status UPDATED, e renovação pode alterar itemId. Evidência documental, sem testar dados do titular. Controles próprios e migration estão no [plano T19b1](../../plan/T19b1-SEPARATE-CONSENTS.md); cobertura original Open Finance por banco continua não comprovada.

Pendência SEC-05/T51b: o [guia da API](https://meu.pluggy.ai/api-guide) usa IDs opacos de recurso em path/query upstream. Antes do adapter real, fechar ADR sobre esse limite necessário somente no destinatário fixo aprovado, sem credenciais/PII/valores em URLs nem propagação ao app/logs/terceiros; confirmar retenção do fornecedor. Isso não autoriza exceção automática à política atual. A página pública também referencia Google Tag Manager; isso não prova conteúdo bancário enviado, e o fluxo autenticado ainda precisa de revisão. Nenhuma conta/conexão foi aberta nas ferramentas.
