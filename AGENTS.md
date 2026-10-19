# Trabalho no Orbe Finance

**Retomado em 19/10/2026 por instrução do usuário.** Continuar automaticamente, uma task por vez, com checkpoints. Teste físico permanece adiado para a validação final. Ler roadmap/STATE.md.

Direção vigente: ler [SPEC-009](specs/009-meu-pluggy/spec.md), [plano Meu Pluggy](plan/MEU-PLUGGY.md) e STATE. Automação Meu Pluggy Bradesco/MP PF é principal; Open Finance é a única origem financeira admitida. Revisão0.4 prevalece sobre arquitetura exclusivamente local. Continuar automaticamente uma task por vez; T13/T14a/T15a concluídas; T26b/T16a concluídas; T32a concluída; T51a concluída; T50a concluída; T50b concluída; T18a concluída; T18b1 concluída; T33a concluída; T18b2 runtime desligado concluída; T59a concluída; T60a concluída; T60b concluída; T60c1 concluída; T19a concluída; T20a concluída; T20b1/T19b1 concluídas; T20b2 concluída; T21a concluída; T21b concluída; próxima T22a movimentos canônicos com fixtures; consentimentos proxy/banco separados. Login/proprietário e bloqueio implementados, somente dados financeiros sintéticos. Recuperação por código depende de SMTP (T11c); teste físico permanece ao final.

Comece por [roadmap/STATE.md](roadmap/STATE.md). Depois consulte spec da tarefa, plano, backlog e decisões. Este repositório é independente do Bolão F1; não copiar .env, chaves, banco ou pipelines daquele projeto.

- Etapa autorizada em 16/10/2026: executar uma task por vez após publicar documentação na main. Não contratar, conectar banco real ou reutilizar infraestrutura/segredos do F1.
- Método: spec → plan → tasks → implement → validate. Identificar requisito antes de implementar; mudança de contrato começa pela spec e ADR.
- Produto: uso próprio, iPhone/Expo Go, senha, Bradesco/Mercado Pago PF (Inter/Nubank em expansão) e preferência gratuita. Face ID depende de build compatível; registrar limitação sem simular sucesso.
- Segredos de provedor ficam no backend; dados bancários reais não vão para Git, testes, logs, screenshots ou documentos. Pesquisa pública não é autorização para abrir contas, consentir, contratar ou movimentar dinheiro.
- Regras financeiras: centavos por moeda, datas/estados explícitos, null não é zero, reservas não geram saldo extra, transferência própria não é consumo e override manual sobrevive à sync.
- Fonte documental/lista de cobertura não equivale à homologação real; não declarar integração concluída sem evidência por banco. Não presumir disponibilidade de API/SDK só pela experiência no outro app.
- Cada microtask precisa de dependências, responsável, paths limitados, critério de aceite e evidência. Dividir tarefa grande em subtasks antes de expandir escopo. Alterações compartilhadas ficam com integrador único.
- Atualizar STATE/TASKS ao concluir tarefa e antes de interrupção. Preservar próxima ação, bloqueios e testes já feitos. Não depender da memória do chat ou de janela de cinco horas.
- Versionar mudanças com Conventional Commits em português e identidade Git configurada. Nunca sobrescrever trabalho existente ou publicar artefatos financeiros privados.

[Specs](specs/README.md) · [Plano](plan/PLAN.md) · [Tasks](tasks/TASKS.md) · [Roadmap](roadmap/ROADMAP.md) · [Decisões](docs/decisions/DECISIONS.md) · [Pesquisa](docs/research/FEASIBILITY.md).

- Revisão de privacidade: ler SPEC-006/007 e docs/security antes de decisões técnicas. Nenhum fornecedor aprovado para finanças reais. IA/MCP/devtools não acessam produção financeira, nem read-only. Expo Go permanece sintético; T63 precede homologação de banco. Relatórios internos não autorizam exportação, BI, analytics ou novas saídas. Privacidade prevalece sobre gratuidade; não prometer risco zero ou E2EE sem protocolo/chaves comprovados.

- Contrato T74: plan/T74-BRIDGE-CONTRACT.md. Ponte de leitura sem persistir valores financeiros; Supabase Auth/Functions e RLS apenas de metadados. Cache/relatórios no aparelho, sem cron/webhook no MVP. Uma task por vez; fonte bancária original deve comprovar Open Finance.

- T01 definiu SDK57 para iPhone11/iOS26.6.2/ExpoGo57.0.9; Node22.23.2/npm12.2.0 instalados. Ler plan/T01-RUNTIME-STRUCTURE.md antes de código. Não usar Node18 default ou SDK latest automaticamente; paths futuros definidos no contrato.

- Usuário autorizou continuidade automática entre tasks; uma por vez significa sequência e checkpoint, não pedir nova confirmação. Prosseguir nas tasks independentes se outra estiver bloqueada por serviço/aparelho.
