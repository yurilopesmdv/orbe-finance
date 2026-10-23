# Liberação pessoal — 21/10/2026

O titular confirmou Open Finance no Bradesco e Mercado Pago e autorizou expressamente concluir a ativação usando os acessos existentes, mantendo Expo Go e orçamento zero. Essa instrução substitui os bloqueios documentais anteriores de uso exclusivamente sintético e de nova aprovação por tarefa. Não autoriza movimentar dinheiro, contratar serviços ou publicar dados. Não representa garantia de risco zero nem certificação do fornecedor.

## Evidência técnica e escopo

Consulta restrita a Auth/item/consentimentos confirmou a cadeia do proxy Mercado Pago: o consentimento aponta para um item original diferente, acessível pela mesma credencial, conector606/OpenFinance verdadeiro/não sandbox/UPDATED/SUCCESS. Há um consentimento ativo não revogado com permissões Open Finance. Identificadores permanecem privados. IDs diferentes são esperados entre proxy e origem; o backend valida ambos sem alterar o payload. O banco deve coincidir com o vínculo previamente cadastrado do titular.

A ativação exige sessão atual do proprietário, vínculo pending/revisão atual, inventário técnico concluído, consentimento bancário vigente (null explícito é prazo indeterminado), proxy vigente e interseção das permissões/produtos. Migration18 registra o ID original apenas no esquema privado. O cliente não pode fornecer evidência nem escolher IDs do provedor. Capacidade de cofrinhos continua falsa sem relação comprovada. Bradesco ainda não possui proxy cadastrado nesta aplicação; estar conectado no portal pessoal não basta.

A primeira leitura de valores ocorre somente por ação da sessão do titular no app, no backend próprio. Ferramentas de desenvolvimento não consultam nem imprimem esses valores. Valores permanecem em memória volátil no aparelho, são limpos ao bloquear/segundo plano; banco próprio armazena metadados técnicos. Senha não é salva. Retenção e subprocessadores do Pluggy continuam sujeitos aos termos do fornecedor, sem alegação de E2EE ou de inexistência absoluta de vazamentos.

## Operação e reversão

ORBE_OWNER_LIVE_RELEASE é o kill switch independente. Exige também ORBE_BRIDGE_ENABLED/ORBE_PRIVATE_DATA_APPROVED e flags individuais de inventário, ativação, contas, movimentos e investimentos. Default de todas é false. `financial-release.py enable-owner` verifica18 migrations, fontes/identidade das duas Functions, digests das credenciais e chaves, altera somente flags e confirma resultado. Falha tenta voltar todas para false. `financial-release.py disable` desliga; não revoga consentimento no banco. Não rotaciona credenciais nem faz chamadas financeiras.

Publicação ao proprietário exige recibo privado600 fora do Metro correspondente ao projeto/runtime/hashes do cliente. Iniciar Metro local com integração real é recusado. EAS usa argumentos fixos, CLI offline, ambiente restrito, prazo240s e artefatos exportados sem dados reais. Configuração dinâmica e assinatura customizada são recusadas; a via de verificação RSA do node-forge não é usada. Braces não recebe dados bancários: export/processamento de globs é local sobre fontes confiáveis. Os advisories sem patch continuam registrados pela auditoria; isso é mitigação delimitada deste fluxo pessoal, sem suprimir resultados, estender automaticamente exceções ou declarar bibliotecas corrigidas. Dependências vulneráveis não compõem o JS do app/Edge, conforme auditoria do bundle recém-exportado.

## Aceite

Tipos e testes de origem/consentimento, ownership/RLS, replay, cancelamento, limites e rollback; SQL em transação revertida antes e após migration; export iOS/Hermes e scan de segredos; CI; fontes/digests remotos; HTTP anônimo sem acesso; manifesto/QR remoto. Teste positivo de valores depende da sessão do titular no iPhone e será registrado ao final, sem solicitar imagens ou valores.

## Atualização23/10 — T81 autorizada pelo titular

Persistência financeira local criptografada autorizada expressamente: AES256GCM/Keychaindeviceonly, owner+projeto, slotscriptografados/30dias/4MiB. Fechar/background preserva ciphertext e limpa memória; logout/clear apagam. Preparar/ativar conexões bancárias já aceitas pode ocorrer automaticamente no app aberto, sem nova concordância Orbe. Consentimento vigente/sessão/owner/revisão continuam obrigatórios. Nenhuma leitura financeira pelas ferramentas, persistência no servidor ou contratação adicionada. Nubank612 suportado; callbackConnect200 validado antes de cadastro. Spec012 eAUTOMATIC-WALLET descrevem fronteiras/testes/limites; aceite nativo no aparelho permanece pendente.
