# O que funciona e o que falta — 23/10/2026

## Em uso e confirmado pelo titular

- Login lembrado e proteção de captura/multitarefa.
- Valores reais, cache criptografado no iPhone e Nubank (confirmados em 23/10).
- Carteira com Mercado Pago, Bradesco e Nubank; sincronização automática no app aberto. Produtos aparecem conforme a fonte entrega.

## Entrega T82 — categorias e gastos reais

Publicado no Expo Go em23/10, CI39995370769 aprovado e1276 verificações; QR em [EXPO-PREVIEW](EXPO-PREVIEW.md). Implementação: edição de categoria/tipo em Minhas movimentações; relatório real por mês, banco e moeda, gráfico de barras e movimentos detalhados; sugestões locais de categoria e identificação de itens a revisar/maior categoria. Dados permanecem no dispositivo; não usa IA externa. Validação/publicação registradas em roadmap/STATE.md.

Categoria e tipo são coisas diferentes. Marque Gasto de consumo para entrar no total de despesas. Transferências, aplicações e pagamento de fatura não são consumo. Tipo desconhecido não vira gasto automaticamente. Sugestões por palavras são propostas, não decisões automáticas.

As correções sobrevivem às atualizações e à reabertura enquanto o cache existir. Logout, apagar cache, expiração ou remoção do cache pelo iOS removem também essas correções. Não há backup nem sincronização de classificações entre dispositivos. Essa limitação deve permanecer visível na edição.

## Pendências de implementação — não dependem de novas credenciais

1. **Cartões:** importar contas de crédito, compras, faturas, parcelas e limites; reconciliar pagamento de fatura sem duplicar o gasto. SPEC011 / T80, ainda apenas planejado.
2. **Organização avançada:** criar categorias próprias, regras recorrentes editáveis, edição em lote e orçamento por categoria. T82 entrega catálogo inicial e correções por movimento.
3. **Análises históricas:** comparação real de períodos equivalentes, séries patrimoniais a partir de observações existentes, metas reais e progresso. Telas demonstrativas não significam implementação real.
4. **Experiência:** teste físico da nova edição/gráfico, acessibilidade e fluxo Adicionar banco; refinamentos visuais conforme uso.

## Limites da fonte e da plataforma

- Cofrinhos do Mercado Pago: não recebidos separadamente. Não presumir que um investimento ou o saldo representa cofrinho.
- Investimentos: integração de leitura existe; ausência de posições recebidas não comprova patrimônio zero.
- Cartões não entram ainda nos relatórios de consumo. Movimentos recebidos podem não representar histórico completo.
- Face ID não habilitado nesta distribuição Expo Go. Cadastro público e recuperação de senha continuam desligados; uso pessoal atual não depende deles.

Prioridade sugerida após T82: cartões/faturas (T80), depois regras/categorias/orçamentos e comparações. Projeto não está integralmente concluído; as integrações de conta e a base protegida já estão em uso.
