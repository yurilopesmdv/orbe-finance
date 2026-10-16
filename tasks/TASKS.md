# Microtasks — backlog de implementação

Estado em 16/10/2026: **nenhuma task T foi iniciada**. A autorização atual é somente planejamento. Dependências não autorizam iniciar código, provisionar backend, contratar ou conectar banco. T01–T06 são preparações/spikes da fase seguinte; autorizar implementação permite executar as tasks técnicas dentro do escopo aprovado, sem pedir confirmação a cada mudança reversível.

## Planejamento entregue

| ID | Resultado | Estado |
|---|---|---|
| P01 | Ler repositório e confirmar ausência de app/configuração | done |
| P02 | Pesquisar documentação primária e comparar viabilidade/custos | done |
| P03 | Escrever specs antes de plano/tasks, com requisitos e aceite | done |
| P04 | Incorporar quatro bancos e preferência gratuita informados pelo usuário | done |
| P05 | Preparar plano, ADRs e microtasks dependentes | done |
| P06 | Preparar roadmap/checkpoint e validar documentos | done |

## Contrato de execução

Cada task abaixo é uma unidade revisável, com uma única pessoa/frente responsável. Alvo de 20–60 minutos de trabalho ativo; timebox é estimativa, não promessa. Se superar esse tamanho, registrar subtasks Txx.a/Txx.b com seus critérios antes de continuar. Homologações podem depender de janelas bancárias externas; tempo de espera não transforma task em concluída.

Ao iniciar: registrar responsável, commit base, requisitos/spec lidos, dependências, paths exatos permitidos e evidência esperada em STATE. Ao encerrar: registrar resultado, testes/comandos sanitizados, arquivos/commit, limitações e próximo ID. Estados válidos: todo, doing, blocked, review, done, deferred. T46 é deferred por depender de mudança de distribuição. T35 pode ser deferred se T34 comprovar incompatibilidade, com motivo e compensação em T36/T43; não marcar feita sem endpoint validado.

Legenda de frentes: Acesso, Dados, Domínio, Backend, UI, Integração, Validação e Operação. Uma frente é responsabilidade, não necessariamente um agente ativo. Contratos de entrada são os requisitos e a saída das dependências; todos os critérios abaixo exigem prova reproduzível e o cenário correspondente em [validação](../docs/VALIDATION.md).

| ID | Dependências | Requisitos | Responsável lógico | Entrega pequena | Aceite / evidência mínima |
|---|---|---|---|---|---|
| T01 | — | PRD-04 | Integração | Definir iPhone/iOS/Expo Go, SDK, Node e paths finais | Matriz de compatibilidade registrada; nenhuma versão herdada automaticamente |
| T02 | T01 | AUTH-01, AUTH-03, AUTH-04, AUTH-06 | Acesso | Spike de senha, recuperação, sessão e bloqueio no runtime | Contrato documentado para background, restart e recuperação sem scheme próprio |
| T03 | — | PRD-05, OF-01, OF-09 | Integração | Confirmar termos/cotas do uso pessoal e trilha Open Finance | Plano pessoal confirmado, quatro bancos elegíveis ou limites registrados; sem contratar pago |
| T04 | T01 | EXP-02, EXP-05, PORT-04 | Domínio | Fechar contrato monetário e catálogo de casos sintéticos | Expectativas dos exemplos de gastos e sobreposição aprovadas documentalmente |
| T05 | T01 | UX-01, UX-04 | UI | Desenhar wireframes estáticos dos cinco fluxos | Fluxos com estados vazio/parcial/erro e textos de fonte/data, sem app funcional |
| T06 | T02, T03, T04, T05 | PRD-06 | Integração | Atualizar specs e registrar conclusão dos spikes | Decisões por requisito e escopo da primeira fatia em ready; implementação autorizada |
| T07 | T06 | PRD-04, PRD-07 | Base | Bootstrap Expo e configuração local independente | Projeto abre no Expo Go do proprietário sem dependência do F1 |
| T08 | T07 | PRD-07, AUTH-02 | Dados | Preparar backend separado e migrations versionadas | Destino conferido, sem tocar projeto F1, credenciais privadas fora do app |
| T09 | T07 | PRD-06 | Base | Configurar checks de CI do novo repo | Instalação por lockfile, typecheck e testes de exemplo passam em CI |
| T10 | T08 | AUTH-01, AUTH-02 | Acesso | Provisionar proprietário e restringir novos cadastros | Proprietário entra; nova conta não autorizada não acessa dados; recuperação testável |
| T11 | T07, T10 | AUTH-03, AUTH-06 | Acesso | Implementar login, recuperação e logout | Sucesso, erro, expiração, offline e logout cobertos sem persistir senha |
| T12 | T11 | AUTH-04, AUTH-05, AUTH-07 | Acesso | Implementar bloqueio e privacidade por AppState | Retorno exige senha; dados não piscam; Face ID ausente no Expo Go |
| T13 | T08, T04 | OF-05, PORT-05 | Dados | Criar conexões, contas e lotes com ownership | Constraints e RLS impedem referências entre donos; migrations reaplicáveis no ambiente de teste |
| T14 | T13 | EXP-02, EXP-04 | Dados | Criar movimentos, categorias, regras e overrides | Reimportação não apaga override e categoria de outro dono é negada |
| T15 | T13 | PORT-02, PORT-03, PORT-04 | Dados | Criar posições, relações de ativos e reservas | Representação de inclusão sem ciclos e testes de sobreposição preparados |
| T16 | T15 | PORT-07 | Dados | Criar metas e alocações atômicas | Duas gravações concorrentes não excedem o valor alocável |
| T17 | T13, T14, T15, T16 | AUTH-02 | Validação | Executar matriz RLS/ownership com duas identidades | CRUD, joins, RPCs e relações cruzadas negados para não dono/anônimo |
| T18 | T03, T13 | OF-02, OF-07 | Integração | Implementar adaptador autenticado e provisionamento privado | Segredos server-side; item validado e associado somente ao proprietário fixado |
| T19 | T18 | OF-01, OF-03 | Integração | Normalizar capacidades e estados de conexão | Capacidade ausente/negada é distinta de coleção vazia; origem de autorização rastreável |
| T20 | T13, T18 | OF-04, OF-05 | Backend | Implementar fila, lease e idempotência de jobs | Repetição e interrupção de worker não duplicam execução nem deixam job perdido |
| T21 | T18, T20 | OF-04, OF-06 | Integração | Importar contas por lote completo | Paginação/timeout não promovem parcial como completo; sem zeros falsos |
| T22 | T14, T20, T21 | OF-05, EXP-01 | Integração | Importar movimentos e alterações da fonte | Repetição, cancelamento e janela incremental tratados sem apagar ausentes indevidamente |
| T23 | T15, T20 | OF-05, PORT-02 | Integração | Importar posições de investimentos | IDs, valores null, moeda, bruto/líquido e datas preservados |
| T24 | T15, T21, T23 | PORT-03, PORT-04, PORT-06 | Domínio | Reconciliar reservas e ativos canônicos | Total sem dupla contagem; ambiguidades geram subtotal parcial e não rentabilidade inventada |
| T25 | T14, T22 | EXP-02, EXP-03, EXP-04 | Domínio | Aplicar categoria e tipo com precedência explícita | Override vence regra, que vence provedor; Sem categoria preserva valor |
| T26 | T04, T22, T25 | EXP-05, EXP-06, EXP-07 | Domínio | Calcular mês, estornos, transferências e cartão | Exemplos financeiros fecham com lista; pareamento incerto não remove despesa |
| T27 | T17, T21, T22, T23, T24, T26 | PRD-02, UX-02 | Backend | Expor consultas financeiras autenticadas | Filtros/paginação/total/data/completude consistentes e sem acesso cruzado |
| T28 | T05, T07, T12 | UX-01, UX-03, UX-04 | UI | Criar shell, componentes e estados sintéticos | Safe area, texto dinâmico, acessibilidade e dados demonstrativos identificados |
| T29 | T27, T28 | PRD-01, UX-02, UX-03 | UI | Criar visão geral com parciais e fontes | Mostra os quatro bancos ou ausência explícita; ocultar valores inclui leitor de tela |
| T30 | T25, T26, T27, T28 | PRD-03, EXP-01, EXP-03, EXP-04 | UI | Criar lista/filtros e revisão de classificação | Resumo e detalhe concordam; alteração manual persiste após nova importação |
| T31 | T24, T27, T28 | PORT-01, PORT-02, PORT-05 | UI | Criar carteira de contas e investimentos | Livre/reservado/valor desconhecido e moedas não se confundem |
| T32 | T16, T24, T31 | PORT-03, PORT-07 | UI | Criar visão de reservas e metas locais | Alocação não cria dinheiro, não transfere e não duplica total |
| T33 | T19, T20, T28 | OF-08, OF-09, UX-05 | UI | Criar conexões, guia pessoal e reimportação | Retorno manual seguro, cooldown e pausa; sem campo público de item arbitrário |
| T34 | T18, T19, T20 | OF-07 | Integração | Validar autenticidade e contrato de entrega de eventos | Mecanismo documentado do plano ou webhook explicitamente desabilitado |
| T35 | T20, T34 | OF-04, OF-05, OF-07 | Backend | Implementar entrada de webhook se viável | ACK após persistência; payload forjado/repetido não altera ownership nem gera coleta ilimitada |
| T36 | T20, T21, T22, T23 | OF-04, OF-06, OF-09 | Backend | Configurar reconciliação limitada e recuperação de falhas | Itens conhecidos, quotas, backoff, observabilidade e modo off comprovados |
| T37 | T17, T20, T33, T36 | AUTH-08, OF-08 | Backend | Implementar pausa, remoção e apagamento | Job em curso/evento atrasado não recria dados; limites de backups/revogação explicados |
| T38 | T27, T29, T30, T31, T32, T33, T37 | PRD-04, UX-01, UX-04 | Validação | Validar R1 com cenários sintéticos no iPhone | Login/bloqueio, filtros e totais passam; R1 não é apresentada como integração real |
| T39 | T03, T18, T21, T22, T23, T24, T36, T38 | PRD-01, OF-01 | Integração | Homologar Nubank com autorização do titular | Ficha por banco completa, dados conciliados e reserva explicada ou limitação registrada |
| T40 | T39 | PRD-01, OF-01 | Integração | Homologar Inter | Segunda origem prova consolidação/transferência sem duplicidade; ficha completa |
| T41 | T40 | PRD-01, OF-01 | Integração | Homologar Mercado Pago | Saldo remunerado/reserva investigados, sem inferir cofrinho por nome |
| T42 | T41 | PRD-01, OF-01 | Integração | Homologar Bradesco | Comparar contas/movimentos/posições e registrar cobertura efetiva do contexto |
| T43 | T39, T40, T41, T42, T35, T37 | OF-05, OF-06, OF-08 | Validação | Exercitar falhas integradas e segurança operacional | Evento fora de ordem, 429, revogação, fonte parcial e retry passam sem dados reais em Git |
| T44 | T09, T38, T43 | PRD-06, PRD-07 | Operação | Configurar publicação privada e recuperação | CI precede deploy; runtime compatível, secrets independentes e rollback documentados |
| T45 | T44 | PRD-01, PRD-02, UX-03 | Validação | Aceitar R2 no iPhone e registrar release | Quatro bancos homologados ou redução aceita; evidências sanitizadas e limites explícitos |
| T46 | T45 | AUTH-07, PRD-08 | Pesquisa | Avaliar distribuição nativa e Face ID para R3 | Decisão de build/custo registrada antes de código; Expo Go continua sem promessa biométrica |

## Limites de arquivos e paralelismo futuro

Até T06: apenas documentos/spikes dentro de escopo autorizado; nenhum executável faz parte da entrega atual. T07 define estrutura de paths. Depois disso, antes de delegar:

| Frente | Escopo permitido a atribuir | Escritas compartilhadas |
|---|---|---|
| Acesso | Feature de sessão e testes de acesso | Configuração Auth/migration só pelo integrador de Dados |
| Dados | Migrations e testes de constraints/RLS | Sequência de migrations reservada por uma única frente |
| Domínio | Funções monetárias/classificação/reconciliação e testes | Contrato de entidades muda primeiro na spec/plano |
| Integração/Backend | Adaptador, worker, endpoints e testes HTTP | Secrets/deploy alterados somente pelo integrador |
| UI | Feature de tela e componentes específicos | Rotas raiz/tema/shared alinhados antes de escrever |
| Validação/Operação | Evidências e smoke tests, configuração de entrega | Sem conexão bancária/ação externa implícita em nome da validação |

O integrador controla package.json/lockfile, navegação raiz, migrations, contratos comuns, plano, tasks e STATE. Trabalho paralelo só após dependências prontas e paths sem sobreposição; revisão integra uma task por vez. Cada delegado recebe ID, entradas, arquivos permitidos, comportamento esperado, testes e proibições de dados reais/segredos. Não reutilizar instruções ou credenciais do F1.

Caminho crítico proposto: T01–T06 → T07/T08 → T10–T17 → T18–T27 → telas/ingestão → T38 → homologações → T43–T45. Há paralelismo possível entre pesquisa de cobertura e wireframe, ou funções puras de domínio e UI sintética após contratos; não existem agentes trabalhando agora.
