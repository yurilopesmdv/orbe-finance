# T09 — Checks de CI

Estado: done — checks locais e primeira execução remota passaram. Base c07cb13; T07 artefatos verificados, smoke físico ainda pendente. PRD-06. Paths .github/workflows/checks.yml, scripts/audit-dependencies.mjs, package.json, docs/security/DEPENDENCIES.md e checkpoints. Sem deploy ou secrets bancários.

Workflow main/PR, permissões contents:read, Actions fixadas em SHA oficial, Node da .nvmrc e npm12.2.0, npm ci --ignore-scripts, typecheck/20 testes, compatibilidade e export iOS. Nenhum artefato financeiro é publicado.

Auditoria não deve ignorar falha silenciosamente. Exceção temporária até23/10/2026 só para os dois advisories sem patch identificados na T07, restrita ao escopo sintético. Qualquer novo advisory, erro de consulta, inconsistência ou prazo expirado falha o check. Gate real continua fechado; exceção não certifica o pacote ou libera uso real.

Tags/SHAs verificados pela API pública GitHub: actions/checkout v7.0.1 e actions/setup-node v7.1.0. Validar comandos locais antes do push e observar resultado remoto sem fabricar execução.

## Evidência local

TypeScript e29 testes passaram (20 sessão +9 política de audit); YAML parseado com8 etapas e permissão somente leitura. Auditoria real reconheceu18 pacotes afetados por2 raízes revisadas, mantendo prazo/limite sintético. Durante validação, grafo npm revelou ciclos legítimos entre metavulnerabilidades: política usa alcance de raiz revisada, não rejeita todo ciclo, e teste cobre ciclo com/sem raiz. Sem alertas novos aceitos automaticamente. Bundle iOS já validado na T07; workflow o reexecuta em CI. Primeira execução remota será registrada após push.

Primeira CI concluída com success: https://github.com/yurilopesmdv/orbe-finance/actions/runs/38957346131, commit e7677f4. Inclui instalação por lockfile,29 testes/typecheck, compatibilidade,audit restrito e export iOS. Nenhum deploy/secret bancário.
