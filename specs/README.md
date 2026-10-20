# Specs do Orbe Finance

Versão documental 0.1 — 16/10/2026, America/Sao_Paulo. Atualização20/10/2026: prévia sintética e acesso privado publicados; estado de implementação em [STATE](../roadmap/STATE.md), integração bancária real ainda não validada. Execução sintética autorizada em 16/10/2026, uma task por vez.

A ordem de trabalho é **spec → plan → tasks → implement → validate**. As specs precedem cada implementação; consultar tasks/STATE para progresso e evidências atuais. Requisitos usam DEVE para comportamento obrigatório, PODERÁ para evolução. Decisões técnicas propostas estão no plano, separadas dos requisitos de produto.

| Spec | Contrato |
|---|---|
| [000 — Produto](000-product/spec.md) | Propósito, escopo, releases e critérios globais |
| [001 — Acesso](001-access/spec.md) | Senha, sessão, privacidade e biometria |
| [002 — Open Finance](002-open-finance/spec.md) | Conexões, consentimento e sincronização |
| [003 — Gastos](003-spending/spec.md) | Transações, categorias e consolidação mensal |
| [004 — Carteira](004-portfolio/spec.md) | Contas, investimentos, cofrinhos e reconciliação |
| [005 — Experiência](005-experience/spec.md) | Navegação e estados da interface |
| [006 — Segurança](006-security/spec.md) | Privacidade, fornecedores, saídas e gate de dados reais |
| [007 — Relatórios](007-reports/spec.md) | Profundidade por detalhe progressivo, sem serviços externos |
| [008 — Contas PF](008-personal-data/spec.md) | Persistência PF e origem exclusivamente Open Finance |
| [009 — Meu Pluggy](009-meu-pluggy/spec.md) | Fornecedor selecionado, automação PF e controles da ponte |

## Processo e controle de mudança

1. A spec registra problema, limites, requisitos identificados e exemplos de aceite.
2. A pesquisa diferencia evidência de fornecedor, hipótese e resultado realmente observado.
3. O plano relaciona arquitetura, contratos e risco aos requisitos; decisão relevante recebe ADR.
4. Cada microtask recebe ID, dependências, arquivos sob responsabilidade, critério de aceite e evidência esperada. Nenhuma task é concluída por ter apenas código escrito.
5. A fase técnica foi autorizada; executar uma task por vez, conforme dependências e gates de dados reais.
6. Alteração de escopo atualiza spec e ADR antes de abrir as tasks correspondentes. Histórico Git preserva versões; IDs de requisitos não são reutilizados.
7. Validação relaciona requisito → task → cenário → evidência e registra falhas/limites.

Estados: draft, ready, implementing, validated, deferred. As dez specs estão ready somente para a fatia R1 sintética após T06. Requisitos bancários/nativos reais continuam pendentes; ready não significa validated. SPEC-009 prevalece nas decisões da automação PF; [plano Meu Pluggy](../plan/MEU-PLUGGY.md) é a entrada técnica vigente. Ready exige resolver as decisões que bloqueiam aquela fatia; não exige concluir todos os bancos antes de uma fatia sintética autorizada. O caminho prioritário é uso pessoal, Bradesco/Mercado Pago PF e senha. Gratuidade é preferência subordinada à privacidade; Expo Go permanece ambiente sintético até decisão de runtime para dados reais. A exigência original de Face ID permanece rastreada, condicionada ao runtime.

Próximos documentos: [plano](../plan/PLAN.md), [microtasks](../tasks/TASKS.md), [roadmap](../roadmap/ROADMAP.md) e [estado de retomada](../roadmap/STATE.md).
