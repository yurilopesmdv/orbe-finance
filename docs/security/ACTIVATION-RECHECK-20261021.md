# Ativação bancária — verificação objetiva de21/10/2026

O titular priorizou a ativação. Esta revisão separa implementação faltante de comprovação externa. Nenhuma leitura financeira ou contato com fornecedor foi feita.

## Pendência técnica resolvida nesta etapa

As chaves de identidade e cursor das movimentações não estavam provisionadas. `scripts/movement-keys.py init` agora cria uma única vez duas chavesCSPRNG de32bytes distintas, em perfil privado fora do projeto; `check` não cria nem rotaciona. O configurador valida esse perfil antes de rede, inclui as duas flags antes ausentes e permite somente valorfalse. Conferência de digests, preservação dos demais segredos, identidade/fontes/versões remotas continuam obrigatórias. Valores não vão a logs, Git, Expo ou relatórios. Isso prepara a ativação sem declarar um banco ativo.

## O que a pesquisa pública confirmou

- O [guia pessoal oficial](https://docs.pluggy.ai/en/docs/guides/meu-pluggy-personal-use) mantém o caminho MeuPluggy para acesso próprio, gratuito, até cinco conexões, separado do processo comercial. Cada banco gera um item espelhado na aplicação; uma conta e um cartão não são dois bancos. Essa documentação não comprova que os dois itens estejam registrados neste Orbe.
- [Item resources](https://docs.pluggy.ai/en/docs/connections/resources) descreve recursos do consentimento Open Finance original. Lista vazia em conector direto não comprova consentimento; a data resourcesCollectedAt e a origem são essenciais. A documentação não declara que um item proxy MeuPluggy exponha toda a evidência da conexão original. Não podemos preencher `open_finance_verified_at` a partir da etiqueta do proxy ou de uma lista vazia.
- [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) e [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) ainda não listam versão corrigida. Não existe upgrade oficial indicado nesses avisos para aplicar nesta consulta. A avaliação anterior de alcance continua limitada; ausência no JS publicado não é prova de segurança de toda a distribuição. Não alterar a exceção somente sintética.
- A [política do fornecedor](https://www.pluggy.ai/legal) mantém permissões de processamento por parceiros e em outros países, com exclusão sujeita a exceções. Não comprova inventário completo dos subprocessadores, conteúdo/retencão dos logs ou ausência universal de processamento por IA no fluxo pessoal. Lacuna documental não é prova de vazamento; também não satisfaz automaticamente o requisito de privacidade acordado.

## Ativação efetiva ainda não realizada

O vínculo MP estápending, sem capacidades aprovadas; o item da aplicação referente ao Bradesco ainda não foi identificado. Ainda não existe uma liberação comprovada da origem/consentimento original para promover esses vínculos aactive. Preparar segredos e telas não substitui essa etapa. Código de ativação deve consumir evidência definida antes de escrever estado, capacidades e datas; não criar um atalho administrativo que simplesmente marque tudo como aprovado.

Além disso, os gates de fornecedor e runtime/dependências permanecem em [RELEASE-READINESS](../RELEASE-READINESS.md). Mensagem“ativado” seria incorreta enquanto eles estiverem abertos. Nova bateria de fixtures não resolve essas pendências; os testes físicos ficam para a validação final já combinada. A autorização para implementar não muda, por si, as propriedades técnicas da conexão ou da distribuição.

## Informação mínima para resolver a origem

É necessário confirmar, na origem de cada conexão já existente no MeuPluggy, que a modalidade é OpenFinance e identificar a validade do consentimento original e o item espelhado correto da aplicação. Somente metadados; não enviar senha, CPF, conta, saldo ou extrato. Enquanto o fornecedor não documentar uma forma programática de obter isso do proxy, não inventar endpoint nem buscar dados financeiros para adivinhar o banco. O roteiro de perguntas ao fornecedor já existe em ACTIVATION-BLOCKERS-20261020.md e não foi enviado.
