# Trabalho no Orbe Finance

Comece por [roadmap/STATE.md](roadmap/STATE.md). Depois consulte spec da tarefa, plano, backlog e decisões. Este repositório é independente do Bolão F1; não copiar .env, chaves, banco ou pipelines daquele projeto.

- Etapa autorizada em 16/10/2026: investigação e planejamento, somente Markdown. Não criar código, manifests, migrations executáveis, dependências, infraestrutura ou conexões bancárias enquanto essa instrução não for ampliada pelo usuário.
- Método: spec → plan → tasks → implement → validate. Identificar requisito antes de implementar; mudança de contrato começa pela spec e ADR.
- Produto: uso próprio, iPhone/Expo Go, senha, Mercado Pago/Bradesco/Inter/Nubank e preferência gratuita. Face ID depende de build compatível; registrar limitação sem simular sucesso.
- Segredos de provedor ficam no backend; dados bancários reais não vão para Git, testes, logs, screenshots ou documentos. Pesquisa pública não é autorização para abrir contas, consentir, contratar ou movimentar dinheiro.
- Regras financeiras: centavos por moeda, datas/estados explícitos, null não é zero, reservas não geram saldo extra, transferência própria não é consumo e override manual sobrevive à sync.
- Fonte documental/lista de cobertura não equivale à homologação real; não declarar integração concluída sem evidência por banco. Não presumir disponibilidade de API/SDK só pela experiência no outro app.
- Cada microtask precisa de dependências, responsável, paths limitados, critério de aceite e evidência. Dividir tarefa grande em subtasks antes de expandir escopo. Alterações compartilhadas ficam com integrador único.
- Atualizar STATE/TASKS ao concluir tarefa e antes de interrupção. Preservar próxima ação, bloqueios e testes já feitos. Não depender da memória do chat ou de janela de cinco horas.
- Versionar mudanças com Conventional Commits em português e identidade Git configurada. Nunca sobrescrever trabalho existente ou publicar artefatos financeiros privados.

[Specs](specs/README.md) · [Plano](plan/PLAN.md) · [Tasks](tasks/TASKS.md) · [Roadmap](roadmap/ROADMAP.md) · [Decisões](docs/decisions/DECISIONS.md) · [Pesquisa](docs/research/FEASIBILITY.md).

- Revisão de privacidade: ler SPEC-006/007 e docs/security antes de decisões técnicas. Nenhum fornecedor aprovado para finanças reais. IA/MCP/devtools não acessam produção financeira, nem read-only. Expo Go permanece sintético; T63 precede homologação de banco. Relatórios internos não autorizam exportação, BI, analytics ou novas saídas. Privacidade prevalece sobre gratuidade; não prometer risco zero ou E2EE sem protocolo/chaves comprovados.

- Revisão vigente 0.3: contas PF confirmadas, prioridade Bradesco/Mercado Pago; ler SPEC-008, ADR-010 e plan/PF-IMPLEMENTATION.md. Núcleo local selecionado, trilha cloud condicional. T64–T73 são próxima fatia; automação ainda não comprovada. Importação/manual não substitui silenciosamente o objetivo de Open Finance. Zero código permanece nesta etapa.
