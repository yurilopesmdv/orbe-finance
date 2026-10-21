# Investimentos no Orbe

A tela privada **Seu acesso → Ver meus investimentos** apresenta posições por banco e moeda, com líquido, bruto e data da fonte. Ausência de valor não é zero. Nomes de aplicações, titular, documentos, códigos e dados extras do provedor não são enviados ao aplicativo. Posições são identificadas por IDs internos aleatórios, separados dos IDs do fornecedor.

## Funcionamento

A atualização é manual. O app verifica sessão e proteção de tela, consulta metadados da conexão e adquire uma lease compartilhada com as demais leituras. O backend verifica novamente owner/sessão, revisão, capacidade e consentimentos, faz claim único e autentica no provedor. O item precisa habilitar INVESTMENTS. São aceitas até10páginas de100 posições e1000linhas, com contadores consistentes e sem sobreposição. O prazo do backend é20segundos; não há repetição automática em429.

O snapshot inteiro é validado antes de registrar IDs técnicos. Somente os IDs, nunca valores, chegam ao registro de posições do Supabase. Após a projeção, o backend reautentica a mesma sessão e confirma que os vínculos não mudaram. A resposta mínima usa centavos exatos, `amount` como bruto e `balance` como líquido. Líquido ausente não usa o bruto como substituto.

O cliente lê o registro de posições por RLS **depois** dessa etapa, verifica todos os IDs recebidos e prepara um lote volátil. Só promove para a memória após finalização remota bem-sucedida. Falha no registro/finalização ou bloqueio da sessão impede promoção. Segundo plano/fechamento limpa o cache; senha, valores e posições não são persistidos. O refresh token lembrado segue a política de Keychain do login.

## Cobertura e reservas

`complete:true` significa que a paginação desta consulta terminou. `partial:true` e `authoritative:false` continuam explícitos: não garantem todo patrimônio nem autorizam apagar ausentes. Relação com o saldo da conta é desconhecida, impedindo total consolidado possivelmente duplicado. BRL/USD/EUR ficam separadas; moedas diferentes são exclusões parciais. Status fora de ACTIVE invalida o snapshot nesta versão.

Cofrinhos não são inferidos por nome ou por ser CDB. A fonte precisa comprovar a natureza e o vínculo com o ativo/saldo original. A tela informa essa indisponibilidade; não cria saldo fictício nem contabiliza duas vezes uma aplicação. Os modelos locais de reservas já existentes não comprovam suporte bancário real.

## Configuração

Cliente: `investmentReadsEnabled`, `liveIntegrationEnabled`, `privateFinancialDataApproved`. Backend: `ORBE_INVESTMENT_READS_ENABLED`, `ORBE_BRIDGE_ENABLED`, `ORBE_PRIVATE_DATA_APPROVED` e gate de código do entrypoint. Gates habilitados para uso pessoal na prévia atual; ativação exige sessão do titular e prova de consentimento. Configuração técnica é somente backend; nenhuma ClientSecret/APIkey vai para o Expo.

Migration17 registra progresso técnico, sessão em hash, claim e contagem, sem valores. Migration16 mantém positions e bindings com RLS. Não editar migrations aplicadas. O teste `backend:cloud:test-position-bindings` usa identidades fictícias e rollback, preservando o proprietário configurado. Nenhuma ferramenta de desenvolvimento pode consultar finanças reais.

## Validação e limites

Teste integrado percorre provedor fictício→Auth/HTTP/backend→registroRLS→transporte→sessão/cache com1000posições, resposta maior que128KiB e valores exatos29/39centavos. Também verifica recusa do finish, registro ausente, lock e gateoff semrede. O teste de RPC em memória não substitui a fixtureSQL instalada.

Mercado Pago tem origemOF e permissões comprovadas por metadados; cobertura de posições ainda depende da validação no iPhone. Bradesco continua sem proxy cadastrado. Política atual em docs/security/OWNER-RELEASE-20261021.md e docs/RELEASE-READINESS.md. Tests passarem e conector constar em tabela pública não homologam contas pessoais. Não há promessa de risco zero ou disponibilidade de cofrinhos.
