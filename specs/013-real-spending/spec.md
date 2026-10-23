# SPEC-013 — Categorias e análises da carteira real

Autorizado em 23/10/2026. Cache e Nubank confirmados pelo titular nesta data.

- Editar tipo financeiro e categoria de cada movimento real. Identidade composta fonte/conta/movimento; correção local prevalece sobre nova leitura, sem alterar a fonte.
- Correções persistem exclusivamente no cache AES existente, vinculadas à conexão/revisão e ao proprietário. Logout, apagar cache e expiração removem também as correções; explicar ao usuário. Falha de gravação deve ser visível.
- Catálogo inicial: alimentação, moradia, transporte, saúde, educação, lazer, compras, assinaturas, impostos e outros. Sem categoria é válido. Categorias não transformam automaticamente uma saída em consumo.
- Relatório real por mês, moeda e banco, com gastos líquidos por categoria, barras locais e detalhamento dos movimentos. Agregação sobre todos os registros carregados, nunca só a página.
- Tipo desconhecido exige revisão; transferências/aportes/resgates/fatura não são consumo. Estornos sem vínculo não diminuem o total. Ausência nunca significa zero completo.
- Inteligência inicial determinística no dispositivo: sugestão de categoria por termos explícitos, confirmada pelo titular, maior categoria de consumo e quantidade a revisar. Nenhuma IA externa, telemetria ou envio de descrições.
- Ocultação cobre gráficos, proporções, nomes de categorias associadas a gastos e descrições. Meses sem leitura mostram ausência e botão de atualização. Sem evolução ou previsões inventadas.
- Cartões/faturas SPEC011, regras recorrentes personalizadas, categorias personalizadas, orçamento/metas reais e evolução patrimonial seguem pendentes; não alegar produto completo.

Aceite: override sobrevive refetch/cache; isolamento de banco/revisão; totais exatos/sem transferência; lista e gráfico reconciliados; proteção/lock; teste sintético e publicação remota. Teste físico agrupado depois.
