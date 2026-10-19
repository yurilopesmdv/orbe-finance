# Estado de retomada — 19/10/2026

Execução ativa, retomada expressamente pelo usuário. Continuar automaticamente, uma task por vez com spec → plan → tasks → código → validação → commit/push. Não aguardar novo “pode continuar” após tarefa. Repositório /home/yurilopesm/projects/orbe-finance, main. Próxima **T60a**: comparação pura de períodos com base zero/negativa, mês aberto/parcial/sem histórico e precisão explícitos. T59a filtros por conta/tipo/categoria e contexto pai concluídos. T18b2 runtime gerenciado desligado orbe-bridge v1 sempre503; adapters ativos ainda não homologados. T33a guia desconectado e T18b1 portas REST locais concluídas.

## Produto e limites obrigatórios

Orbe pessoal, iPhone11/iOS26.6.2/ExpoGo57.0.9/SDK57. Open Finance exclusivamente via Meu Pluggy, Bradesco/Mercado Pago PF prioritários, Inter/Nubank expansão. Sem importação manual. Provedor/ponte veem conteúdo durante processamento; não prometer risco zero/E2EE. Nenhum banco conectado, payload real, consentimento, cron/webhook ou recurso pago criado. liveIntegrationEnabled e biometricLoginEnabled permanecem false. Expo Go somente finanças inventadas; dados reais dependem de gates T63/T78/runtime e cobertura original de Open Finance por banco.

## Implementado e publicado por tarefa

- T74/T01/T02/T03/T04/T05/T47/T48/T49/T06: contratos, runtime, spike, pesquisa/fixtures/wireframe e gates documentados.
- T07/T09: bootstrap SDK57 e CI por lockfile/SHAs oficiais; sem deploy automático do app.
- T26b: formatter exato por unidades/centavos BigInt e Intl.parts; extremo seguro termina ,91; Money usa mesmo label visual/acessível.
- T26: dinheiro/datas/despesas/estornos; T24: carteira sem duplicar reserva, null/overlap parcial; T25: classificação por campo override > regra > provedor.
- T28: welcome/quatro abas, componentes e sete estados demonstrativos.
- T27a: consulta local pura compartilhada (filtros, dedup, paginação, evidência de estorno); T27b privada/autenticada pendente.
- T29a/T30a/T31a: resumo/lista/carteira com dados inventados, fonte/data/parcialidade; overrides voláteis separados da fonte, recarga preserva, sair limpa. Ocultação compartilhada em memória e ao background; persistência privada fica nas subtasks b.
- T57a/T58a: agregados por categoria/tipo reconciliados e relatório → detalhe por pilha preservando filtros; rota aceita apenas filtros conhecidos, sem valores/tokens. Subtasks b/físico pendentes.
- T08: projeto Supabase **orbe criado pelo usuário**, ativo/saudável em us-east-1. Baseline remota aplicada por Management API, hash imutável no nome do histórico.
- T10: proprietário criado pelo titular no Dashboard e provisionado por UUID privado; conta confirmada/não anônima, registro singleton privado e RPC orbe_is_owner booleana por auth.uid. Senha/e-mail do titular nunca consultados nas ferramentas.
- T11a/T11b login/logout: gateway REST com origem/chave pública restritas, autorização server-side, SessionModel de token volátil, telas login/account; resultado tardio/expiração/logout não restaura sessão. **T11 integral não concluída**, recuperação T11c bloqueada.
- T32a: tela de metas demonstrativas pela Carteira, formulário exato/seed/reset, guard inventado somente na demo, título livre oculto junto do valor; T32b privado pendente.
- T16a: metas/alocações voláteis com orçamento de raiz não reservado explícito, revisão/qualidade/moeda e concorrência JS; sem transferir fundos nem persistir. T16b nativo pendente.
- T15a: snapshots voláteis por conexão/produto, autoritativo explícito, relações/null/moedas preservadas; MemoryScope compartilhado com ledger. T15b privado pendente.
- T14a: ledger volátil com guard principal/geração, promoção de lote completo, categorias/regras/overrides separados; não ligado a cache privado real. T14b persistência pendente.
- T13: metadados de conexões/contas sob RLS, IDs externos privados, FKs compostas/estado/capacidades testados em SQL real. Zero vínculos reais.
- T12a: AppState bloqueia/aborta/limpa sessão em inactive/background/desconhecido; retorno exige senha; formulário limpa email/senha/código. T12b físico pendente.

## Backend e arquivos privados

~/.config/orbe-finance/backend.env contém PAT/ref/UUID do dono (arquivo0600/diretório0700, fora do Expo). .env.backend.local contém somente ORBE_BACKEND_ENV_FILE, ponteiro estrito para esse destino. Nunca imprimir conteúdo, pôr em Expo/EXPO_PUBLIC ou copiar do F1. .env.local contém somente URL/publishable/flag recuperação false, também ignorado; .env.example é modelo público. Reiniciar Metro após mudar env. Não consultar saldo/transações reais nas ferramentas.

Migrations remotas: 20261016170000_bootstrap.sql , 20261019180000_owner_access.sql e20261019200000_connection_metadata.sql. API atribui versão remota; nome é orbe_<stem>_<sha256>. Não usar CLI db push remoto, pois timestamps diferem; helper Management API confere hashes antes de aplicar. Não editar migration aplicada. scripts/backend-admin.py: inspect/bootstrap (somente banco vazio)/migrate/set-owner/test-owner/test-metadata/configure-client; npm scripts correspondentes. Não aceita SQL arbitrário por argumento, não segue redirects nem imprime respostas brutas.

Docker local segue parado: Mailpit publicou wildcard54344 apesar da rede loopback e launcher parou somente Orbe. Não reabrir esse diagnóstico ou tocar outros containers/firewall. Nenhum projeto F1 acessado. Metro permanece parado; não iniciar túnel/novo teste físico agora.

## Recuperação T11c bloqueada

Supabase Free/default sender recusou customizar template OTP (HTTP400). configure-client grava EXPO_PUBLIC_AUTH_RECOVERY_ENABLED=false; UI não oferece envio de código sem suporte. Gateway/telas de recuperação preparados/testados, porém sem entrega real. Exige SMTP próprio revisado e teste de entrega antes de habilitar; não contratar/upgrade automaticamente. Nenhum email de teste foi enviado por ferramenta. Não parar tarefas independentes por isso.

## Validações e limites

TypeScript e **283 testes** passaram:20 spike,9 audit,18 gastos,19 carteira,18 classificação,11 query,3 cenário,2 overrides,19 guardas admin,20 gateway,18 sessão,8 relatórios,6 rotas,5 lifecycle,14 ledger,10 assets,6 apresentação,13 metas,4 demo-goals,4 referências,1 crawler Metro,10 ambiente/CLI,21 HTTP ponte,17 REST ponte,1 hostmock,6 guardas deploy. Bundle Hermes iOS final exportado (2,5MB), PAT/UUID privado ausentes nos artefatos. Doctor21/21 e compatibilidade SDK passaram na T07.

SQL real test-owner: dono permitido, segunda identidade/sem sessão/registro ausente negados, papéis authenticated/anon reais, schema/tabela privados inacessíveis; rollback/zero identidades temporárias conferidos. Smoke HTTP opt-in (scripts/auth-smoke.py + tests/auth/live-denial.mjs): fakeuser confirmado sem email, token válido não proprietário negado por RPC/gateway, anônimo negado, fakeuser deletado em finally. Nenhuma senha do titular usada; login positivo/recuperação/gestos/VoiceOver/snapshot iOS ainda não homologados fisicamente.

Auditoria:18 high em duas raízes sem patch, exceção somente sintética até23/10 (cutoff24/10UTC). Não liberar finanças reais com isso.10 moderados corrigidos por overrides; não usar audit fix --force. CI não recebe secrets e executa testes sintéticos/audit/export; smoke/SQL remoto são opt-in locais.

## Próximos passos

1. T60a: spec/plan antes de comparações puras com meses/observações explícitos e BigInt. T59a passou283 testes/export/scan: contexto por conta/tipo/categoria preservado; scopeCategory da rota recomputa parcialidade pai sem confiar em flag do cliente. T60b UI será posterior, sem inventar histórico.
2. T14–T17: repositório privado/runtime e testes, respeitando Expo Go sintético/segurança. Não promover cache financeiro real sem decisão de runtime.
3. Integração ponte T18+, cobertura Open Finance/termos por banco T77/gates; relatórios/filtros avançados T59/T60 e restante UI conforme backlog.
4. Resolver T11c/SMTP sem custo/fornecedor novo não revisado. Teste físico T38/T45/T53/T61 somente ao final conforme usuário.

Git local foi reparado em19/10: nove objetos vazios recuperados de mirror remoto, hashes/fsck conferidos, sem reset de arquivos. Backups em /tmp/orbe-git-backup-20261019 e /tmp/orbe-git-recovery-20261019.git; relatório docs/validation/2026-10-19-git-recovery.md. Identidade Yuri Lopes, Conventional Commits em português, main/push autorizados. Nenhum agente ou instalação pendente.

T13 validada: test-metadata real passou para dono/segunda identidade/anon, escrita e ids externos negados, FKs/active sem verificação negados. Rollback sem fakeusers e dono preservado; três migrations reexecutadas sem duplicar. CI do348a2e7 aprovada: https://github.com/yurilopesmdv/orbe-finance/actions/runs/39243268152.

T32a bundle iOS final exportado (2,5MB), PAT/UUID privado ausentes nos artefatos. Confirmação/interação/VoiceOver nativos ainda não testados, conforme pedido de deixar aparelho ao final.

T51a concluída: referências opcionais agora estritas em runtime, payloads/objetos inválidos recusados antes da promoção. Valores reais bancários continuam ausentes; nenhum request de leitura ao .env pelo Metro foi feito.

T18a: máximo100 status metadata, prazo20s/body16KiB, auth e owner expiração em porta ainda abstrata. Sem imports do cliente. CI d62e27b aprovada: https://github.com/yurilopesmdv/orbe-finance/actions/runs/39252717540.

T18b2 helper scripts/bridge-deploy.py usa API/CLI2.121.0 offline, sem Docker/link/prune. Recusa fontes extras/privadas e função existente sem manifest/id/versão correspondente. Configtoml novoentrypoint index.mjs; UI continua livefalse. CIcf64abe aprovada.
