# Home financeira do Orbe

Estado vigenteT81,23/10/2026. Tema grafite/violeta, uso pessoal no iPhone/ExpoGo. [QR atual](EXPO-PREVIEW.md) e [automação/cache](AUTOMATIC-WALLET.md).

A home apresenta saldo consolidado por moeda, subtotais de contas/investimentos, identificação de Mercado Pago/Bradesco/Nubank e cinco movimentos recentes do mês atual/anterior. Moedas não são convertidas ou misturadas. Investimentos com composição desconhecida aparecem separados do saldo para evitar dupla contagem; cofrinhos exigem evidência da fonte. Null não vira zero. Investimentos sem posições recebidas não são tratados como patrimôniozero.

Atalhos preservam telas completas de contas, investimentos, movimentações e conexões. Ver todas abre o período do movimento mais recente. Os estados por banco/produto/revisão distinguem espera, atualização, falha, intervalo e leitura concluída sem posições. Capacidade disponível na fonte não é comprovante de posições existentes.

## Atualização e cache

Abrir/retomar valida sessão e metadados, restaura cache criptografado local e atualiza produtos elegíveis. Janela recente15min evita repetir produtos; revisão/datafonte alteradas invalidam a validade. A data armazenada da fonte não é um feed em tempo real: após a janela, uma leitura ainda pode ser necessária para confirmar mudanças. Meses sem leitura ou falhos têm retentativas limitadas. Um job por vez por hub, produtos sequenciais/banco, admissão30s porproduto/lease120s; cliente antigo mantém protocolo legado900s.

A preparação/ativação de conexões pendentes já aceitas no banco ocorre automaticamente pela sessão do titular, por autorização expressa23/10. Pausado/revogado/consentimento vencido não reativa. Adicionar banco usa conectorMeuPluggy200 e recebeID via callback validado, sem cópia manual no fluxo normal.

Navegar mantém memória privada. Background/lock limpa memória e aborta consultas; ciphertext local permanece para a próxima autenticação. Sair da conta e Apagar cache deste iPhone e bloquear removem a cópia local. AES256GCM nativo/Keychaindeviceonly/doisslots/30dias/4MiB, sem finanças no Supabase/logs. Sem coleta com app fechado; detalhes e limites em AUTOMATIC-WALLET.

## Precisão e cobertura

Formatador monetário usa strings de centavos inteiros seguros, sem Intl.NumberFormat/formatToParts nativo. Funciona com extremos e moedas explícitas sem arredondar ou converter; ocultação precede formatação e não informado difere de erro de formatação. Titular confirmou valores apósT78.

MP eBradesco ativos por metadados; Nubank validado/cadastrado para ativação automática ao abrir a nova versão. Valores/descrições não foram consultados por ferramentas; primeira leituraNu e cache nativo precisam de aceite no aparelho. [Cobertura](BANK-COVERAGE.md), [prontidão](RELEASE-READINESS.md), [specs](../specs/012-automatic-wallet/spec.md).
