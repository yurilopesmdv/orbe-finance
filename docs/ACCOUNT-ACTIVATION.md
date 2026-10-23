# Acessar seus bancos no Orbe

A liberação pessoal foi implementada em21/10/2026 e o fluxo de ativação corrigido em23/10/2026. Você já possui conta e credenciais configuradas: não recrie o login, não regenere chaves e não envie IDs ou dados bancários no chat. Use o QR remoto atual em [EXPO-PREVIEW](EXPO-PREVIEW.md).

## Mercado Pago

1. Entre com sua conta existente e abra **Ver minhas conexões**.
2. Na conexão Mercado Pago, toque em **Preparar e ativar leitura**. A preparação e a verificação do consentimento são feitas em sequência, sem outro botão. O servidor confere o consentimento original Open Finance e a sessão do proprietário antes de ativar.
3. Volte e abra **Ver minhas contas → Atualizar saldos desta conexão**. Movimentações e investimentos têm telas próprias com atualização por conexão. Cada consulta respeita limites e intervalos; aguarde quando o app informar cooldown.

A ativação confirma o vínculo e permissões, não a exatidão de cada produto. Verifique no próprio aparelho a moeda/data/cobertura. Ausência de informação não significa zero. Os valores ficam em memória durante o uso e são descartados ao bloquear/sair do primeiro plano; não são armazenados no banco próprio nem enviados às ferramentas de desenvolvimento. Os termos de retenção do banco e Pluggy continuam aplicáveis.

## Bradesco

O portal Meu Pluggy possui a conexão original, mas esta aplicação ainda só tem o proxy Mercado Pago identificado. Um item com conta e cartão não representa dois bancos. Não duplicar o ID do Mercado Pago nem marcar Bradesco ativo sem seu próprio proxy. O plano pessoal não fornece listagem global de itens. O compartilhamento do Bradesco com a aplicação é uma etapa distinta da autorização original no portal; não é necessário refazer credenciais já válidas. Essa conexão não está sendo apresentada como concluída.

## Segurança e limites

A origem Mercado Pago foi comprovada por cadeia proxy→consentimento→itemoriginal, conector606/OpenFinance/não sandbox/atualizado, sem consultar valores. IDs distintos são preservados e comparados pelo backend; migração18/owner/sessão/revisão/inventário impedem ativação por payload do cliente ou replay. Cofrinhos permanecem indisponíveis sem relação explícita da fonte; CDB não cria saldo extra. Relatórios/gastos/metas demonstrativos continuam separados dos dados privados.

Sessão lembrada usa refresh token rotativo em Keychain, sem senha salva. FaceID e cadastro público continuam desligados. Proteção de captura e multitarefa foi confirmada pelo titular; cobertura de outros controles e produtos ainda requer validação final no iPhone. Não existe promessa de riscozero.

## Operação

`financial-release.py enable-owner` verifica fontes/digests/migrações antes de liberar flags. `financial-release.py disable` desliga as leituras, sem revogar consentimento no banco. ORBE_OWNER_LIVE_RELEASE é o kill switch independente. Publicação exige recibo privado e o uso de Metro com integração real é recusado. Nenhum serviço pago contratado.

[Política de liberação pessoal](security/OWNER-RELEASE-20261021.md) · [Prontidão](RELEASE-READINESS.md) · [Tasks](../tasks/TASKS.md).


A correção23/10 elimina a necessidade de dois cliques separados. Enquanto prepara e verifica, aguarde na tela; a mensagem de falha aparece junto da conexão. Diagnóstico e limites em [ACTIVATION-TROUBLESHOOTING](ACTIVATION-TROUBLESHOOTING.md).
