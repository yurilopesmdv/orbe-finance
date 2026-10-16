# SPEC-005 — Experiência profissional no iPhone

Estado: draft. Esta é uma especificação textual de produto; wireframe local estático em docs/design/wireframes.html; ainda não há app executável.

| ID | Requisito |
|---|---|
| UX-01 | DEVE oferecer navegação simples: Visão geral, Movimentações, Carteira e Ajustes; Conexões acessível pela visão geral/ajustes |
| UX-02 | DEVE mostrar fonte, data e completude perto dos valores; botão de ocultar valores é preferência persistida sem conter dados financeiros |
| UX-03 | DEVE distinguir carregando, vazio real, sem conexão, parcial, desatualizado, erro e acesso bloqueado |
| UX-04 | DEVE respeitar safe areas, texto dinâmico, contraste e rótulos acessíveis; informação não depende só de cor |
| UX-05 | DEVE explicar capacidades indisponíveis sem controles falsos e permitir retorno seguro após autorização externa |

## Desenho textual

Visão geral: saudação discreta, ocultar valores, total de ativos reconciliados ou subtotal parcial, contas, gastos do mês e status de conexões. Datas diferentes não ficam escondidas em Ajustes. Indicador explícito de dados demonstrativos quando sintéticos.

Movimentações: seletor de mês, filtros por banco/conta/tipo/categoria, total reconciliável e lista. Detalhe permite revisar tipo/categoria e ver origem/estado sem editar a transação bancária. Carteira: seções Contas, Investimentos e Cofrinhos; agregações consistentes com SPEC-004 e drill-down por instituição. Ajustes: segurança, conexões, categorias/regras, privacidade/exclusão e versão.

Conexões: Bradesco/Mercado Pago PF prioritários, Inter/Nubank em expansão, disponibilidade por produto, autorização pendente/renovação, última importação e dados da fonte, orientação do modo pessoal e Buscar dados disponíveis. Sem coleta de senha bancária pelo Orbe.

Direção visual proposta: sóbria, fundos neutros, um acento de marca, hierarquia tipográfica forte, valores alinhados e gráficos pequenos acompanhados de lista acessível. Sem copiar tema F1, bandeiras, gamificação ou ranking. Português do Brasil, BRL e datas locais. Paleta final pertence à task de wireframe, sem necessidade de imagens geradas agora.

## Aceite

- AC-U01: da visão geral até os gastos de uma categoria, no máximo três ações, sem perder o filtro do mês.
- AC-U02: banco indisponível não oculta bancos válidos; resumo diz quais fontes faltam.
- AC-U03: leitor de tela comunica valor, moeda, fonte, data e parcialidade; ocultar valores mascara texto acessível também.
- AC-U04: ao retomar do banco/navegador, autenticação do Orbe precede exposição financeira e atualização de status.
- AC-U05: fontes vazias mostram “Nenhuma movimentação no período”; erro de consulta mostra erro e opção de tentar novamente, não o mesmo vazio.

## Aprofundamento progressivo

Aplicar [SPEC-007](../007-reports/spec.md): tela inicial com poucos indicadores e navegação resumo → relatório → dados de origem. Filtros avançados ficam sob demanda, com contexto preservado ao voltar. Relatórios são gráficos/listas internos, sem SDK analítico/BI externo; confidencialidade é regida por [SPEC-006](../006-security/spec.md). Nenhum aviso técnico substitui texto simples sobre data e parcialidade perto do valor.

## Direção T05

Quatro abas: Visão geral, Movimentações, Carteira, Ajustes. Relatórios acessíveis pela Visão geral e por totais de gastos, mantendo período/filtro ao voltar. Conexões ficam em Ajustes e no status do resumo. Fundo claro neutro, verde escuro como acento, tipografia do sistema; gráficos sempre acompanhados de lista. Wireframe não integra banco nem simula aprovação de segurança/Face ID.
