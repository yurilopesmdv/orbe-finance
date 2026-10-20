# Ativação das contas — estado atual

20/10/2026. **Você já criou a conta e conectou Bradesco/Mercado Pago no Meu Pluggy. Não precisa repetir esse cadastro ou reenviar credenciais/IDs.** No Orbe, a leitura bancária continua desativada até concluir os gates. A publicação remota e o QR estão em [EXPO-PREVIEW](EXPO-PREVIEW.md).

## O que já foi feito

- Acesso pessoal criado, sessão lembrada funcionando e proteção de captura/multitarefa confirmada no iPhone.
- Credenciais da aplicação guardadas privadamente, autenticadas uma vez somente em POST/auth e configuradas nos segredos do backend próprio. API key adicional não é necessária; nenhum segredo vai para o Expo.
- Um item Mercado Pago foi cadastrado como pending no Orbe. Ainda não foram registrados IDs de contas, capacidades ou evidência Open Finance; nenhum saldo foi coletado.
- Bridge v5/metadata v4 e 12 migrations próprias verificados. Leitura/descoberta financeiras continuam false no cliente, ambiente e codegate. Não há edição de painel pendente do titular nesta etapa.

## Por que aparecem quantidades diferentes

O portal pessoal mostra duas conexões originais. O detalhe selecionado na demo mostra um item MeuPluggy e seus produtos Mercado Pago: conta e cartão não representam dois bancos. Esse detalhe não prova a listagem completa da aplicação nem que um único item agrega ambos os bancos. O item Bradesco na aplicação ainda não foi identificado; não duplicar o item conhecido nem refazer autorização para contornar isso.

O inventário privado aceita de um a cinco itens observados, com instituição explícita ou desconhecida. Apenas o backend resolve vínculos técnicos. Nenhum identificador ou URL privada deve ir ao chat, Git ou variável EXPO_PUBLIC.

## Próxima liberação

1. Concluir evidências de origem Open Finance por banco e revisão do fornecedor, logs, retenção, exclusão e subprocessadores. O proxy MeuPluggy não comprova sozinho a origem bancária.
2. Resolver a revisão de dependências/runtime e validar os controles nativos com dados inventados. A fonte local do Expo não certifica o binário instalado no iPhone.
3. Versionar a liberação controlada, executar a descoberta no backend sob sessão/owner/lease e somente então permitir a primeira leitura. Não marcar conexão/capacidades como aprovadas artificialmente.
4. No roteiro final, conferir no próprio iPhone saldo/moeda/data e cobertura, sem compartilhar valores com ferramentas. Testar primeiro uma conexão; preservar null/desconhecido/parcial em vez de inventar zero.

A primeira fatia é conta corrente/pagamento. Movimentos, investimentos e cofrinhos reais exigem etapas próprias; o app demonstrativo não comprova essa cobertura. O trabalho técnico independente continua sem solicitar testes intermediários. As lacunas externas não serão substituídas por fixtures ou por mudança silenciosa de flags.

## Operação privada

Perfis ficam em `/home/yurilopesm/.config/orbe-finance/`, fora do Metro, diretório0700/arquivos0600. `pluggy.env` contém somente Client ID/Secret; `pluggy-items.json` é inventário técnico privado. Os helpers `provider-profile.py check` e `provider-items.py check` verificam formato/permissões offline e mostram somente readiness/contagem. Autenticação remota é uma operação separada e já foi concluída; não repetir desnecessariamente.

Não regenerar Client Secret sem necessidade: o anterior é invalidado. Não usar listagem global, refresh não disponível no plano, cookies/scraping ou conectores diretos para contornar o fluxo pessoal. O aviso comercial de acesso real no Dashboard não foi tratado como liberação; o fluxo pessoal é separado. O uso pessoal tem condições e disponibilidade próprias, que precisam ser reconferidas ao ativar.

Referências pesquisadas e histórico estão na [revisão objetiva](security/ACTIVATION-BLOCKERS-20261020.md), [pesquisa Meu Pluggy](security/MEU-PLUGGY-REVIEW.md) e [tasks](../tasks/TASKS.md). Estado técnico atual em [prontidão](RELEASE-READINESS.md). Pesquisa pública não garante ausência de vazamento, não autoriza contato com terceiros e não comprova homologação bancária.
