# T78 — valores indisponíveis na apresentação

Titular vê movimentos recebidos, mas valores indisponíveis em todas as telas. Essa mensagem vem exclusivamente do catch em moneyLabel (null produz Não informado). Valores de movimentos são validados como centavos inteiros antes do cache. Hipótese consistente: falha do formatador Intl no runtime móvel; não houve inspeção do aparelho nem de valores reais.

1. Substituir dependência de Intl.NumberFormat/formatToParts por formatação pt-BR determinística de centavos seguros.
2. Regressões com Intl ausente e lançando erro, extremos, moedas, negativos, ocultação e null.
3. Tipos/testes/export/audit/scans/CI; publicar e verificar QR; documentar entrega e limite do aceite físico.

Sem alteração de importação, schema, consentimento ou telas de detalhe; sem consultas financeiras por ferramentas.
