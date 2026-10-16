# Estado de retomada — revisão 0.3

Checkpoint: 16/10/2026, America/Sao_Paulo. Repo: /home/yurilopesm/projects/orbe-finance, yurilopesmdv/orbe-finance. Etapa autorizada: investigação e planejamento, zero código. O usuário delegou a escolha técnica, subordinada à privacidade; isso não autorizou contratação nem envio de conteúdo financeiro para ferramentas.

## Leitura de retomada

[AGENTS](../AGENTS.md) → este arquivo → [roadmap](ROADMAP.md) → [SPEC-008](../specs/008-personal-data/spec.md) → [plano PF vigente](../plan/PF-IMPLEMENTATION.md) → [tasks](../tasks/TASKS.md). Ler as demais specs relacionadas ao ID da tarefa. O plano gerenciado 0.2 permanece como alternativa condicional, não primeira fatia.

## Pedidos e decisões preservados

- Produto pessoal profissional: contas, gastos por tipo/categoria, investimentos/cofrinhos e relatórios profundos com interface simples.
- Todas as contas são PF, confirmado pelo usuário. Prioridade agora Bradesco/Mercado Pago; Inter/Nubank, do pedido inicial, ficam em expansão.
- Gratuidade é preferência, mas privacidade prevalece. Não prometer ausência universal de vazamento.
- Direção selecionada: núcleo local protegido no iPhone, sem backend financeiro/agregador obrigatório. Senha local, biometria nativa após validação e relatórios no aparelho.
- Expo Go somente sintético; SQLCipher/Face ID exigem runtime compatível. Custos e instalação privada ainda precisam de definição antes de contratar/instalar.
- APIs diretas PF não estão comprovadas como gratuitas e completas. Bradesco: elegibilidade/custo/cobertura faltam; MP: relatórios não provam carteira/cofrinhos integrais. Nenhuma conexão habilitada.
- Importação/manual é contingência/capacidade local identificada, não entrega de Open Finance. Objetivo de automação permanece pendente, não foi silenciosamente descartado.

## Estado real e evidências

27 documentos Markdown, 9 specs, 78 requisitos rastreados e 73 microtasks futuras. Links, referências de requisitos e grafo de dependências verificados; nenhuma task técnica iniciada. Não há package.json, app, SDK instalado, backend, .env, credencial bancária, CI ou deploy do Orbe. Não houve login em banco, consentimento, conta cloud criada ou extrato real lido nesta investigação. [Revisão documental](../docs/PLANNING-VALIDATION.md).

[Fornecedores](../docs/security/VENDOR-REVIEW.md) continuam sem aprovação para conteúdo real. IA/MCP/devtools/CI/Git não têm acesso a dados financeiros. Políticas públicas não certificam risco zero. [ADR-010](../docs/decisions/ADR-010-LOCAL-CORE.md) registra a escolha e os riscos de aparelho, chaves, backup e disponibilidade.

## Próxima ação

Enquanto continuar planejamento, revisar contratos de fonte/runtime e ajustar documentos. Após autorização da fase técnica, começar T64; T65 e T72 seguem suas dependências. Registrar modelo/iOS do iPhone, distribuição e formatos oficiais sem pedir extrato real no chat. T39/T40 (Nubank/Inter) deferred; demais tasks cloud anteriores são condicionais e não devem disparar implementação por existência no backlog.

Nenhuma frente/agente ativo ou path reservado. Push dos commits locais continua pendente da confirmação anteriormente solicitada; nenhuma instrução posterior autorizou envio remoto. Arquivos de código, recursos do F1 ou seu .env não foram reutilizados.

## Checkpoint por task

Registrar ID/estado, requisitos, responsável/paths, commit base, mudanças pendentes, evidências que realmente rodaram, falhas/limites e próxima ação. Nunca registrar senha/token/CPF/conta/valor bancário real. Conferir git status antes de retomar. Checkpoint ao concluir task ou antes de interrupção; nenhuma execução automática a cada cinco horas foi configurada.
