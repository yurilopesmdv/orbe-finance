# Bancos, investimentos e cofrinhos

Diagnóstico em 23/10/2026, somente metadados técnicos autorizados: no diagnóstico inicial, inventário privado continha somente Mercado Pago e Orbe tinha uma conexão Mercado Pago ativa. Após o titular salvar o identificador Bradesco, o proxy e a origem Open Finance603 foram validados por metadados; o vínculo Bradesco foi cadastrado como pending, preservando o Mercado Pago ativo. A leitura de investimentos foi confirmada como concluída com sucesso e zero linhas recebidas. Nenhum saldo, descrição ou posição real foi consultado pelas ferramentas. O titular confirmou que os valores de contas e movimentos aparecem após T78.

## Mercado Pago

Contas e movimentos estão em leitura. A fonte informa capacidade de investimentos, mas a última leitura não retornou posições. Capacidade é suporte técnico ao produto, não prova de que investimentos ou cofrinhos serão enviados. Uma lista vazia não prova patrimônio zero.

O [issue22 no repositório do Meu Pluggy](https://github.com/pluggyai/meu-pluggy/issues/22), consultado em23/10, permanece aberto e relata saldo bancário disponível sem investimentos dos cofrinhos Mercado Pago. É um relato de usuário, sem confirmação de correção ou garantia de cobertura universal. A documentação de [investimentos](https://docs.pluggy.ai/en/docs/products/investments) distingue bruto (`amount`) e líquido (`balance`); não descreve campo ou endpoint específico que comprove a separação desses cofrinhos.

Nesta integração não é possível apresentar o valor dos cofrinhos sem ele ser disponibilizado e identificado pela fonte. O Orbe não estima por diferença de saldo, rendimento, nome de CDB ou transferências. Não há endpoint extra, scraping do banco ou credenciais bancárias adicionadas como atalho.

## Bradesco

O titular forneceu o identificador no arquivo privado. A cadeia proxy→consentimento único→origem Bradesco Open Finance603 foi validada, sem consultas financeiras. O cadastro pendente foi confirmado no Orbe e no inventário privado, com dois bancos distintos. Mercado Pago permanece ativo.

**Próximo passo do titular:** no app, Conexões → Bradesco → Preparar e ativar leitura. Essa ação identifica contas e confirma consentimento pela sessão do proprietário. Depois, voltar à home inicia automaticamente a leitura dos produtos disponíveis. Abrir a home com vínculo ainda pendente não ativa o banco. O app mostra banco sem vínculo ou pendente explicitamente, sem atribuir saldo zero ou somá-lo aos totais.

O [guia oficial Meu Pluggy](https://meu.pluggy.ai/api-guide) exige um Item ID por banco. No Dashboard Pluggy, dentro da aplicação demo, iniciar o conector **Meu Pluggy** e selecionar a conexão Bradesco já autorizada no portal pessoal. O vínculo proxy gerado para Bradesco tem seu próprio Item ID. O identificador Bradesco já foi registrado e validado nesta entrega; a preparação/ativação continua pela sessão do titular. O Item ID do Mercado Pago não pode ser reutilizado.

Não é possível descobrir esse identificador por listagem global: o guia confirma que a listagem de itens retorna403 e não está disponível no uso pessoal. Não usar cookies do navegador, scraping ou enumerar IDs. O Orbe não declara o segundo banco funcional enquanto esse vínculo não existir.

## Estados da interface

Home e investimentos usam recibos em memória por conexão, revisão e produto. Mostram aguardando leitura, atualizando, falha, intervalo, ausência de suporte ou leitura concluída sem posições utilizáveis. Falha preserva o último snapshot válido; bloqueio/logout/segundo plano limpa dados e recibos. O timestamp de sucesso anterior não é substituído por uma falha. Capacidade disponível na tela de conexões não é comprovante de dados recebidos.

Na home, o cartão de investimentos sem posições mostra ausência de dados, não R$0,00. As telas completas de contas, investimentos, movimentos e conexões continuam acessíveis. O novo tema é local, sem fontes, imagens ou serviços externos.
