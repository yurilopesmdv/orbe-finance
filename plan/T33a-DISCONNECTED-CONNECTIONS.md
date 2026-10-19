# T33a — Conexões e guia inicial

Estado: done. OF-01/03/08/09/10, UX-05, AUTH-01. Dependências T28/T11b; fatia informativa independente T19/T20. T33b ativa status/guia homologado e ações reais somente após T19/T20/gates. Integrador único.

Paths: spec002, este plano, src/app/connections.tsx, src/app/(tabs)/settings.tsx, src/app/index.tsx, docs/PRODUTO.md, tasks/TASKS.md, roadmap/STATE.md, AGENTS.md.

Tela secundária acessível por Ajustes → Conexões, mantendo quatro abas/layout/componentes. Duas instituições prioritárias não conectadas; nenhuma chamada/efeito/segredo. Produtos ainda sem cobertura homologada, sem tabela de valores. Texto curto de funcionamento e pausa/desvínculo/revogação, sem links externos ou coleta de dados. Ajustes passa a explicar login configurado e demonstração separadamente e oferece acesso à tela login/account conforme estado. Corrigir texto antigo de login ausente e welcome. Não criar botão de conectar falso.

Aceite: typecheck cliente/ponte/suíte vigente/export iOS/scan privado, revisão de rotas e strings. Sem teste unitário que apenas espelhe texto JSX. Teste físico/VoiceOver permanece ao final. Não confundir guia com homologação de banco ou T33 integral concluída.

## Evidência

TypeScript cliente/ponte,272 testes existentes e export Hermes iOS aprovados. Scan de PAT/UUID nos artefatos negativo. Rotas revisadas: Ajustes → Conexões → voltar; login/account conforme sessão, sem query/rede nova. Leitura física/VoiceOver ainda pendente.
