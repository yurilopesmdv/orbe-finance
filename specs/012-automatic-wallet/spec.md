# SPEC-012 — carteira automática e cache privado local

23/10/2026, solicitação expressa do titular. Substitui exigência anterior de eliminar toda persistência financeira ao fechar/background; proteção visual e purge da memória bloqueada permanecem. Prioridade sobre cartõesT80: finalizar automação primeiro. Uso pessoal Mercado Pago, Bradesco e Nubank.

## Requisitos

- AUTO01: adicionar banco pelo app com conector Meu Pluggy200 e callback mínimo; nenhum ItemID pelo chat/arquivo no fluxo normal. APIkey/ClientSecret somente servidor; token Connect temporário no WebView privado. O titular autorizou preparação/atualização automática das conexões já aceitas. O fluxoMeuPluggy noapp comprova autorização; não acrescentar botão de consentimento duplicado.
- AUTO02: callback não é prova de ownership. Backend valida sessão proprietário, fluxo criptográfico vinculado ao proprietário/sessão/prazo, clientUserId do item, proxy→consentimento único→origemOF do banco suportado. Nada de enumeração global (403pessoal), scraping, cookies ou busca de finanças por ferramentas. Duplicatas idempotentes; não substituir banco ativo por outro item silenciosamente.
- AUTO03: conforme autorização expressa do titular, preparar e ativar automaticamente bancos pending com origem e consentimento bancário vigentes verificados, conforme autorização expressa posterior do titular23/10; na sessão titular, então sincronizar dados. Pausado/revogado/renovação não reativa automaticamente. Erros informativos e retry limitado. NubankOF612 passa a suportado com migration nova.
- CACHE01: cache somente no dispositivo, AES256GCM com nonce nativo novo, chaveKeychain WHEN_PASSCODE_SET_THIS_DEVICE_ONLY; arquivo criptografado emcache fora backup, sem plaintext/persistênciaSupabase. Limite4MiB/validade30dias, vinculado a projeto+usuário autenticado, sem senha/JWT/segredo provedor.
- CACHE02: fechar/background limpa memória/aborta requisições e preserva ciphertext. Após autenticação e metadados vigentes, restaurar somente conexões/revisões elegíveis; identificar cache e última leitura, não apresentar como dado atual. Estado inacessível no login/sem proteção; não prometer acesso offline sem validaçãoAuth.
- CACHE03: logout e Apagar dados deste iPhone removem chave/arquivo. Corrupção/tamper/usuário diferente/versão desconhecida/prazo excedido não exibem dados. Escrita serializada/atômica, logout invalida escrita em andamento. Falha armazenamento não impede consulta online; aviso claro.
- SYNC04: abrir/restaurar consulta metadados em background da UI, sem recarregar tudo se revisão/datafonte inalteradas e cache recente. Verificar a cada15min em primeiro plano; produtos nunca lidos/falhos têm retrylimitado. Nova revisão/datafonte força leitura; cache não contorna consentimento/capability nem vira fonte autoritativa.
- UX02: home inclui bancos registrados e Nubank, adição/consentimento no app, resumo sem dados ausentes inventados. Nunca afirmar detectar banco externo que a API não permite listar; fluxo de importação explica seleção no MeuPluggy.

## Aceite

Fixtures: ciphertext não contém canários; tag adulterada/owner/projeto errado/prazo inválido rejeitados; clear vence save; memória limpa ao background mas arquivo permanece; restauração usa novos ownerScope internos e valida domínio/centavos/categorias/moedas/identidades; banco removido/revogado/revisão trocada não restaura. Abrir sem mudança não chama produtos; mudançafonte chama; pendente prepara/ativa uma vez. HTTP: anônimo/fluxo alheio/expirado/IDforjado/connector direto/clientUserId errado bloqueados; callback válido não vaza item/conta/PII, stage idempotente. Nubank612 aceito, sandbox/direct/ambíguo recusados. CheckSQLRLS/export/audit/scans/CI/deploy/publicação/QR; teste físico final sem expor finanças.

## Fontes

https://meu.pluggy.ai/api-guide ; https://docs.pluggy.ai/en/docs/get-started/faq ; https://docs.pluggy.ai/en/reference/authentication ; https://docs.pluggy.ai/en/docs/connect-widget/introduction ; https://docs.pluggy.ai/en/docs/open-finance/investments ; expo-crypto57AES e expo-file-system57 tipos/código instalados, ExpoGoSDK57. Tokenoptions.clientUserId no corpo correto; callback sempre revalidado pelo servidor. Fluxos externos criados sem callback não podem ser listados retroativamente.

Atualização explícita do titular23/10: remover a confirmação Orbe adicional e atualizar/preparar conexões já aceitas automaticamente no app aberto. A revisão automática inicial rejeitou ativação indiscriminada antes dessa autorização posterior; a implementação atual segue a instrução posterior com validação de consentimento bancário, owner, sessão e revisão. Não autoriza conceder novos consentimentos no banco em nome do titular.
