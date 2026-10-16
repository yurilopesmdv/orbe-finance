# Estado de retomada — execução contínua

Checkpoint: 16/10/2026, America/Sao_Paulo. Repo /home/yurilopesm/projects/orbe-finance, main. Usuário autorizou continuar automaticamente, uma task por vez, sem aguardar novo prompt. Separação de tasks serve para validar/versionar/retomar. Push na main autorizado. Nenhum agente paralelo.

## Próxima ação

T06 concluída; iniciar T07 (bootstrap Expo SDK57). Ler AGENTS, plan/T06-R1-READINESS.md, plan/T01-RUNTIME-STRUCTURE.md e plan/T74-BRIDGE-CONTRACT.md. Selecionar Node22.23.2/npm12.2.0 por shell isolado; default Node18 não serve. Verificar versões reais de registry/template antes de instalar. Não executar outras tasks simultaneamente.

## Concluído

- T74: contrato da ponte (6058f29).
- T01: iPhone11/iOS26.6.2/ExpoGo57.0.9 SDK57 confirmado pelo titular; paths (2a8ef01).
- T02: spike de sessão/recuperação/bloqueio, 20 testes Node22 passaram, sem dependência/rede (b3f69a9).
- T03: termos pessoais/cadência/cotas e lacunas registrados (1f19ac9).
- T04: contrato monetário e 14 fixtures JSON inventadas (13744b4).
- T05: wireframes HTML locais, sintaxe JS validada; sem render automatizado (8be82e4).
- T47/T48/T49: diligência com bloqueio real, fronteiras/chaves e runtime sintético (68d5a51/ec6bb16/152bbda).
- T06: specs ready somente para R1 sintética; prontidão em plan/T06-R1-READINESS.md.

## Contratos preservados

Origem exclusiva Open Finance via Meu Pluggy, Bradesco/Mercado Pago PF prioritários; Inter/Nubank expansão. Sem alimentação por extratos. Gratuidade pessoal documentada não prova origem Open Finance nem cobertura de cada produto. Cofrinhos MP têm relato público de limitação; nenhum banco homologado.

Supabase Auth/Functions planejados em projeto novo, sem persistência de valores financeiros; metadados sob RLS. Fornecedor/ponte leem durante consulta, sem E2EE fictício. Cache/classificação/relatórios no aparelho. Sem cron/webhook inicial. Sessão do backend e bloqueio local são distintos. Face ID/SQLCipher reais não suportados no Expo Go; runtime real segue decisão/teste T65–T67 e gates T63/T78.

## Estado real

Há documentos, wireframe HTML, spike JS e fixtures sintéticas. Ainda não há app, package.json/lockfile, SDK instalado, backend, .env, credenciais, CI ou deploy Orbe. Nenhum banco conectado, login real, consentimento ou contratação. Ferramentas/IA/Git só usam código/públicos/inventados; não acessar .env do F1. Nenhuma falha/resultado de mock comprova privacidade real.

## Checkpoint por task

Registrar ID/estado, requisito, paths, base, resultado, testes realmente executados, limites, commit e próxima ação. Conferir git status; uma task/commit por assunto. Se serviço/aparelho bloquear uma task, registrar e avançar em outra independente autorizada; não marcar teste não executado como sucesso. Não pedir novo “pode continuar” entre tasks. Nenhuma execução periódica de cinco horas configurada.

## T07 — doing / retomada vigente

Bootstrap mínimo SDK57, base 9805406. Registry/template oficial consultados; paths em plan/T07-BOOTSTRAP.md. Nenhum backend/credencial/dado real. Instalar versões e validar typecheck, spike, doctor e export iOS antes de concluir. Smoke físico permanece pendente do titular; não declarar executado.

## T07 — review / retomada vigente

App mínimo criado e dependências instaladas com lockfile/scripts desabilitados. Typecheck/20 testes/Doctor21/21/compatibilidade/export iOS passaram. Metro ativo porta8083, sessão de ferramenta13056; /status confirmou execução. Solicitação assíncrona ao titular para abrir exp://192.168.18.7:8083 e confirmar tela demonstrativa. Nenhum banco/secret/backend.

18 alertas altos de duas raízes transitivas sem patch; ver docs/security/DEPENDENCIES.md. Overrides corrigiram10 moderados; sem downgrade forçado. Próxima task local T09, que depende somente dos artefatos T07 já verificados; smoke físico segue pendente. Não interromper trabalho independente por esperar resposta. T08 ainda sem projeto remoto (não reutilizar credenciais F1).

## T09 — doing

Base c07cb13. Checks GitHub Actions fixados por SHA, sem secrets/deploy; instalação por lockfile/scripts desabilitados, typecheck/testes/compatibilidade/audit/export. Auditoria tem exceção temporária explícita para dois advisories sem patch (somente sintético,23/10/2026); falha fechada para novidades/erro/prazo. Smoke físico T07 pendente.

## T09 — review / retomada vigente

Workflow/scripts de audit implementados,29 testes locais passaram (20 sessão+9 audit), YAML válido8 etapas; primeira execução GitHub pendente após push. T07: QR exibido ao usuário para exp://192.168.18.7:8083, aguardando teste físico; Metro sessão13056. Próxima tarefa após conferir CI: T08 preparar backend próprio, sem usar .env F1. Docker existe, mas consulta ao socket no sandbox foi negada; testar acesso autorizado antes de concluir indisponibilidade. Nenhum projeto Supabase Orbe existente/credencial foi lido.
