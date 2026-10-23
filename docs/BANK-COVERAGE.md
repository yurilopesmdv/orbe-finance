# Bancos, investimentos e cofrinhos

Diagnóstico em 23/10/2026, somente metadados técnicos autorizados: inventário privado contém Mercado Pago; Orbe tem uma conexão Mercado Pago ativa. A leitura de investimentos foi confirmada como concluída com sucesso e zero linhas recebidas. Nenhum saldo, descrição ou posição real foi consultado pelas ferramentas. O titular confirmou que os valores de contas e movimentos aparecem após T78.

## Mercado Pago

Contas e movimentos estão em leitura. A fonte informa capacidade de investimentos, mas a última leitura não retornou posições. Capacidade é suporte técnico ao produto, não prova de que investimentos ou cofrinhos serão enviados. Uma lista vazia não prova patrimônio zero.

O [issue22 no repositório do Meu Pluggy](https://github.com/pluggyai/meu-pluggy/issues/22), consultado em23/10, permanece aberto e relata saldo bancário disponível sem investimentos dos cofrinhos Mercado Pago. É um relato de usuário, sem confirmação de correção ou garantia de cobertura universal. A documentação de [investimentos](https://docs.pluggy.ai/en/docs/products/investments) distingue bruto (`amount`) e líquido (`balance`); não descreve campo ou endpoint específico que comprove a separação desses cofrinhos.

Nesta integração não é possível apresentar o valor dos cofrinhos sem ele ser disponibilizado e identificado pela fonte. O Orbe não estima por diferença de saldo, rendimento, nome de CDB ou transferências. Não há endpoint extra, scraping do banco ou credenciais bancárias adicionadas como atalho.

## Bradesco

A conexão autorizada no portal pessoal Meu Pluggy ainda não tem vínculo próprio registrado no Orbe. O app agora apresenta Bradesco como **Ainda não vinculado ao Orbe**, sem atribuir saldo zero ou somá-lo aos totais.

O [guia oficial Meu Pluggy](https://meu.pluggy.ai/api-guide) exige um Item ID por banco. No Dashboard Pluggy, dentro da aplicação demo, iniciar o conector **Meu Pluggy** e selecionar a conexão Bradesco já autorizada no portal pessoal. O vínculo proxy gerado para Bradesco tem seu próprio Item ID. Esse identificador precisa ser registrado na configuração privada do Orbe, validado como Bradesco Open Finance e preparado/ativado pelo titular na sua sessão. O Item ID do Mercado Pago não pode ser reutilizado.

Não é possível descobrir esse identificador por listagem global: o guia confirma que a listagem de itens retorna403 e não está disponível no uso pessoal. Não usar cookies do navegador, scraping ou enumerar IDs. O Orbe não declara o segundo banco funcional enquanto esse vínculo não existir.

## Estados da interface

Home e investimentos usam recibos em memória por conexão, revisão e produto. Mostram aguardando leitura, atualizando, falha, intervalo, ausência de suporte ou leitura concluída sem posições utilizáveis. Falha preserva o último snapshot válido; bloqueio/logout/segundo plano limpa dados e recibos. O timestamp de sucesso anterior não é substituído por uma falha. Capacidade disponível na tela de conexões não é comprovante de dados recebidos.

Na home, o cartão de investimentos sem posições mostra ausência de dados, não R$0,00. As telas completas de contas, investimentos, movimentos e conexões continuam acessíveis. O novo tema é local, sem fontes, imagens ou serviços externos.
