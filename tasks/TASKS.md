## T82 — gastos reais — 23/10/2026

- [x] T82a: SPEC013, plano e pendências em PRODUCT-STATUS; aceite físico T81 cache/Nubank registrado.
- [x] T82b: correções locais persistidas no cache AES e isoladas por identidade/revisão.
- [x] T82c: editor de movimento, relatório por categoria e análises locais sem rede externa.
- [x] T82d: 1276 verificações, CI39995370769, publicação Expo/QR e evidências em STATE. Aceite físico de edição/gráficos permanece pendente.

# Microtasks — backlog de implementação

Estado atual: **c21–c38 concluídas; 967 testes/typechecks. Próxima T22c12.** Histórico inicial e evidências por microtask abaixo; resumo vigente em [STATE](../roadmap/STATE.md). Implementação autorizada em 16/10/2026, uma task por vez, após publicação do planejamento. Dependências definem a ordem; contratação e conexão real continuam fora da preparação sintética. T01–T06 são preparações/spikes da fase seguinte; autorizar implementação permite executar as tasks técnicas dentro do escopo aprovado, sem pedir confirmação a cada mudança reversível.

## Planejamento entregue

| ID | Resultado | Estado |
|---|---|---|
| P01 | Ler repositório e confirmar ausência de app/configuração | done |
| P02 | Pesquisar documentação primária e comparar viabilidade/custos | done |
| P03 | Escrever specs antes de plano/tasks, com requisitos e aceite | done |
| P04 | Incorporar quatro bancos e preferência gratuita informados pelo usuário | done |
| P05 | Preparar plano, ADRs e microtasks dependentes | done |
| P06 | Preparar roadmap/checkpoint e validar documentos | done |

## Aplicabilidade vigente 0.4

Meu Pluggy é a integração automática selecionada. T74 fecha contratos antes de reutilizar T01–T63; T75–T78 acrescentam validação específica. T64–T73 contêm capacidades locais reutilizáveis; T68 foi retirada e seu ID permanece reservado. A origem financeira será exclusivamente Open Finance. T39/T40 ficam deferred; primeira homologação Bradesco/Mercado Pago. Gate T63 continua obrigatório. Pré-requisitos de R1 concluídos em T06; próxima T07.

## Contrato de execução

Cada task abaixo é uma unidade revisável, com uma única pessoa/frente responsável. Alvo de 20–60 minutos de trabalho ativo; timebox é estimativa, não promessa. Se superar esse tamanho, registrar subtasks Txx.a/Txx.b com seus critérios antes de continuar. Homologações podem depender de janelas bancárias externas; tempo de espera não transforma task em concluída.

Ao iniciar: registrar responsável, commit base, requisitos/spec lidos, dependências, paths exatos permitidos e evidência esperada em STATE. Ao encerrar: registrar resultado, testes/comandos sanitizados, arquivos/commit, limitações e próximo ID. Estados válidos: todo, doing, blocked, review, done, deferred. T46 é deferred por depender de mudança de distribuição. T35 pode ser deferred se T34 comprovar incompatibilidade, com motivo e compensação em T36/T43; não marcar feita sem endpoint validado.

Legenda de frentes: Acesso, Dados, Domínio, Backend, UI, Integração, Validação e Operação. Uma frente é responsabilidade, não necessariamente um agente ativo. Contratos de entrada são os requisitos e a saída das dependências; todos os critérios abaixo exigem prova reproduzível e o cenário correspondente em [validação](../docs/VALIDATION.md).

| ID | Dependências | Requisitos | Responsável lógico | Entrega pequena | Aceite / evidência mínima |
|---|---|---|---|---|---|
| T01 | — | PRD-04 | Integração | Definir iPhone/iOS/Expo Go, SDK, Node e paths finais | Matriz de compatibilidade registrada; nenhuma versão herdada automaticamente |
| T02 | T01 | AUTH-01, AUTH-03, AUTH-04, AUTH-06 | Acesso | Spike de senha, recuperação, sessão e bloqueio no runtime | Contrato documentado para background, restart e recuperação sem scheme próprio |
| T03 | — | PRD-05, OF-01, OF-09 | Integração | Confirmar termos/cotas do uso pessoal e trilha Open Finance | Plano pessoal confirmado, Bradesco/MP PF com trilha Open Finance original confirmada ou lacuna registrada; sem contratar pago |
| T04 | T01 | EXP-02, EXP-05, PORT-04 | Domínio | Fechar contrato monetário e catálogo de casos sintéticos | Expectativas dos exemplos de gastos e sobreposição aprovadas documentalmente |
| T05 | T01 | UX-01, UX-04 | UI | Desenhar wireframes estáticos dos cinco fluxos | Fluxos com estados vazio/parcial/erro e textos de fonte/data, sem app funcional |
| T06 | T02, T03, T04, T05, T47, T48, T49, T74 | PRD-06 | Integração | Atualizar specs e registrar conclusão dos spikes | Decisões por requisito e escopo da primeira fatia em ready; implementação autorizada |
| T07 | T06 | PRD-04, PRD-07 | Base | Bootstrap Expo e configuração local independente | Projeto abre no Expo Go do proprietário sem dependência do F1 |
| T08 | T07 | PRD-07, AUTH-02 | Dados | Preparar backend separado e migrations versionadas | Destino conferido, sem tocar projeto F1, credenciais privadas fora do app |
| T09 | T07 | PRD-06 | Base | Configurar checks de CI do novo repo | Instalação por lockfile, typecheck e testes de exemplo passam em CI |
| T10 | T08 | AUTH-01, AUTH-02 | Acesso | Provisionar proprietário e restringir novos cadastros | Proprietário entra; nova conta não autorizada não acessa dados; recuperação testável |
| T11 | T07, T10 | AUTH-03, AUTH-06 | Acesso | Implementar login, recuperação e logout | Sucesso, erro, expiração, offline e logout cobertos sem persistir senha |
| T12 | T11 | AUTH-04, AUTH-05, AUTH-07 | Acesso | Implementar bloqueio e privacidade por AppState | Retorno exige senha; dados não piscam; Face ID ausente no Expo Go |
| T13 | T08, T04 | OF-05, PORT-05 | Dados | Criar vínculos de conexões/contas e controle de consultas, sem valores financeiros | Constraints e RLS impedem referências entre donos; migrations reaplicáveis no ambiente de teste |
| T14 | T13, T07 | EXP-02, EXP-04 | Dados | Criar repositório local de movimentos, categorias, regras e overrides | Reimportação não apaga override e categoria de outro dono é negada |
| T15 | T13 | PORT-02, PORT-03, PORT-04 | Dados | Criar posições e relações de ativos/reservas no aparelho | Representação de inclusão sem ciclos e testes de sobreposição preparados |
| T16 | T15 | PORT-07 | Dados | Criar metas e alocações atômicas locais | Duas gravações concorrentes não excedem o valor alocável |
| T17 | T13, T14, T15, T16 | AUTH-02 | Validação | Testar RLS de metadados e autorização de repositórios locais com duas identidades | CRUD, joins, RPCs e relações cruzadas negados para não dono/anônimo |
| T18 | T03, T13 | OF-02, OF-07 | Integração | Implementar adaptador autenticado e provisionamento privado | Segredos server-side; item validado e associado somente ao proprietário fixado |
| T19 | T18 | OF-01, OF-03 | Integração | Normalizar capacidades e estados de conexão | Capacidade ausente/negada é distinta de coleção vazia; origem de autorização rastreável |
| T20 | T13, T18 | OF-04, OF-05 | Backend | Implementar lease/cooldown de consultas e idempotência de lotes locais | Uma consulta por conexão; paginação do lote não bloqueada por cooldown; interrupção mantém lote local válido |
| T21 | T18, T20 | OF-04, OF-06 | Integração | Importar contas por lote completo | Paginação/timeout não promovem parcial como completo; sem zeros falsos |
| T22 | T14, T20, T21 | OF-05, EXP-01 | Integração | Importar movimentos e alterações da fonte | Repetição, cancelamento e janela incremental tratados sem apagar ausentes indevidamente |
| T23 | T15, T20 | OF-05, PORT-02 | Integração | Importar posições de investimentos | IDs, valores null, moeda, bruto/líquido e datas preservados |
| T24 | T04 | PORT-03, PORT-04, PORT-06 | Domínio | Reconciliar reservas e ativos canônicos | Total sem dupla contagem; ambiguidades geram subtotal parcial e não rentabilidade inventada |
| T25 | T04, T26 | EXP-02, EXP-03, EXP-04 | Domínio | Aplicar categoria e tipo com precedência explícita | Override vence regra, que vence provedor; Sem categoria preserva valor |
| T26 | T04 | EXP-05, EXP-06, EXP-07 | Domínio | Calcular mês, estornos, transferências e cartão | Exemplos financeiros fecham com lista; pareamento incerto não remove despesa |
| T27 | T17, T21, T22, T23, T24, T26 | PRD-02, UX-02 | Backend | Implementar consultas locais e validar ponte autenticada | Filtros/paginação/total/data/completude consistentes e sem acesso cruzado |
| T28 | T05, T07 | UX-01, UX-03, UX-04 | UI | Criar shell, componentes e estados sintéticos | Safe area, texto dinâmico, acessibilidade e dados demonstrativos identificados |
| T29 | T27, T28 | PRD-01, UX-02, UX-03 | UI | Criar visão geral com parciais e fontes | Mostra Bradesco/MP ou ausência explícita; ocultar valores inclui leitor de tela |
| T30 | T25, T26, T27, T28 | PRD-03, EXP-01, EXP-03, EXP-04 | UI | Criar lista/filtros e revisão de classificação | Resumo e detalhe concordam; alteração manual persiste após nova importação |
| T31 | T24, T27, T28 | PORT-01, PORT-02, PORT-05 | UI | Criar carteira de contas e investimentos | Livre/reservado/valor desconhecido e moedas não se confundem |
| T32 | T16, T24, T31 | PORT-03, PORT-07 | UI | Criar visão de reservas e metas locais | Alocação não cria dinheiro, não transfere e não duplica total |
| T33 | T19, T20, T28 | OF-08, OF-09, UX-05 | UI | Criar conexões, guia pessoal e reimportação | Retorno manual seguro, cooldown e pausa; sem campo público de item arbitrário |
| T34 | T18, T19, T20 | OF-07 | Integração | Validar autenticidade e contrato de entrega de eventos | Mecanismo documentado do plano ou webhook explicitamente desabilitado |
| T35 | T34 | OF-04, OF-05, OF-07 | Backend | deferred: webhook fora da primeira versão | Só retomar com nova spec de autenticação/retencão; sem endpoint público no MVP |
| T36 | T20, T21, T22, T23 | OF-04, OF-06, OF-09 | Backend | Configurar reconciliação ao abrir/retomar e recuperação de falhas | Itens conhecidos, quotas, backoff, observabilidade e modo off comprovados |
| T37 | T17, T20, T33, T36 | AUTH-08, OF-08 | Backend | Implementar pausa, remoção e apagamento | Job em curso/evento atrasado não recria dados; limites de backups/revogação explicados |
| T38 | T27, T29, T30, T31, T32, T33, T37 | PRD-04, UX-01, UX-04 | Validação | Validar R1 com cenários sintéticos no iPhone | Login/bloqueio, filtros e totais passam; R1 não é apresentada como integração real |
| T39 | T03, T18, T21, T22, T23, T24, T36, T38, T63 | PRD-01, OF-01 | Integração | Homologar Nubank com autorização do titular | Ficha por banco completa, dados conciliados e reserva explicada ou limitação registrada |
| T40 | T39 | PRD-01, OF-01 | Integração | Homologar Inter | Segunda origem prova consolidação/transferência sem duplicidade; ficha completa |
| T41 | T38, T78 | PRD-01, OF-01 | Integração | Homologar Mercado Pago | Saldo remunerado/reserva investigados, sem inferir cofrinho por nome |
| T42 | T41, T78 | PRD-01, OF-01 | Integração | Homologar Bradesco | Comparar contas/movimentos/posições e registrar cobertura efetiva do contexto |
| T43 | T41, T42, T34, T37 | OF-05, OF-06, OF-08 | Validação | Exercitar falhas integradas e segurança operacional | Evento fora de ordem, 429, revogação, fonte parcial e retry passam sem dados reais em Git |
| T44 | T09, T38, T43 | PRD-06, PRD-07 | Operação | Configurar publicação privada e recuperação | CI precede deploy; runtime compatível, secrets independentes e rollback documentados |
| T45 | T44, T62, T63, T42, T78 | PRD-01, PRD-02, UX-03 | Validação | Aceitar R2 no iPhone e registrar release | Bradesco/MP comparados privadamente, cobertura por produto explícita; expansão Inter/Nubank adiada; limitações registradas |
| T46 | T45 | AUTH-07, PRD-08 | Pesquisa | Avaliar distribuição nativa e Face ID para R3 | Decisão de build/custo registrada antes de código; Expo Go continua sem promessa biométrica |
| T47 | — | SEC-01, SEC-04 | Pesquisa | Concluir diligência de fornecedores/termos/destinatários | Respostas aplicáveis ao plano, limites e aprovação ou bloqueio; leitura pública atual não basta |
| T48 | T47 | SEC-06, SEC-08 | Arquitetura | Comparar fronteiras de confiança e gestão de chaves | Quem lê plaintext e quem possui cada chave estão explícitos; sem E2EE fictício |
| T49 | T01, T48 | SEC-09, SEC-10, SEC-18 | Pesquisa | Decidir runtime real e inventariar superfícies dev | Expo Go sintético; distribuição real e controles a comprovar registrados sem migração implícita |
| T50 | T09, T48 | SEC-02, SEC-03 | Operação | Isolar ferramentas/ambientes e retirar SDKs de coleta | Sem produção financeira em IA/MCP/CI; dependências e destinos inventariados |
| T51 | T18, T49 | SEC-05, SEC-15 | Backend | Restringir destinos, URLs, redirects e conteúdo da fonte | Canários não saem por URL/asset; texto malicioso não dispara navegação, SSRF ou ferramenta |
| T52 | T20, T50 | SEC-03, SEC-12 | Operação | Validar logging mínimo em sucesso e falha | Sem payload/auth/valor/descrição em logs, traces ou uploads; infraestrutura gerenciada avaliada |
| T53 | T12, T49 | SEC-09, SEC-10 | Acesso | Validar tela, gravação, clipboard e retorno no iPhone | Captura/alternador/teclado e limitações documentados no runtime escolhido |
| T54 | T09, T50 | SEC-11 | Operação | Revisar cadeia de dependências, secrets e atualização | Contas com MFA, privilégios mínimos e bundle/artefatos sem segredos privados |
| T55 | T17, T27 | SEC-07, SEC-16 | Validação | Testar exfiltração por leitura, agregados e cache | Identidade alheia e sessão expirada não acessam nem totais; resultados sanitizados |
| T56 | T37, T48 | SEC-08, SEC-14 | Operação | Provar purge, modo off e restore sem reconexão | Jobs/eventos/backup não reativam dados revogados; retenção real de cada destino registrada |
| T57 | T27, T26, T24 | RPT-02, RPT-03, RPT-06 | Backend | Definir consultas locais privadas e drill-down dos relatórios | Lista fecha com resumo, regras/completude/filtros rastreáveis e sem nova saída externa |
| T58 | T28, T29, T57 | RPT-01, RPT-07 | UI | Criar acesso simples a relatórios internos | Resumo → relatório → detalhe preserva contexto e não exige nova área complexa |
| T59 | T30, T57, T58 | RPT-02, RPT-03 | UI | Adicionar filtros avançados sob demanda | Filtros ativos claros, volta preserva período e tipos financeiros não se confundem |
| T60 | T31, T57, T58 | RPT-04, RPT-05 | Domínio | Comparar períodos e composição sem histórico inventado | Base zero/período parcial tratados; metas não duplicam ativos; snapshots reais existentes |
| T61 | T53, T58, T59, T60 | RPT-08 | UI | Validar listas acessíveis e ocultação nos relatórios | Leitor de tela, gráfico e detalhe respeitam privacidade e navegação simples |
| T62 | T51, T55, T57, T58, T59, T60, T61 | RPT-01, RPT-04, RPT-06, RPT-07, SEC-13, SEC-16 | Validação | Reconciliar relatórios e testar suas saídas com canários | Sem destino externo/exportação; detalhe, agregado e cache privados, sem divergência financeira |
| T63 | T47, T48, T49, T50, T51, T52, T53, T54, T55, T56, T62 | SEC-04, SEC-17, SEC-18 | Validação | Resolver gate de dados reais com o titular | Fornecedores/runtime decididos, riscos residuais registrados, sem alta/crítica aberta; sem consentimento prévio ao gate |

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

## Revisão de prioridade 0.2

T47–T49 são diligência/decisão e não autorizam conectar bancos. Nenhum fornecedor aprovado. T50–T63 ainda não iniciadas; usam sintéticos antes do gate. As tasks anteriores que preparavam adaptador/worker não podem ser usadas como justificativa para acessar produção financeira. Desenvolvimento, inclusive por ferramentas, não lê produção. O backlog agora contém 63 microtasks; IDs anteriores foram preservados.

## Microtasks da primeira fatia PF/local

Todas todo, com execução sequencial autorizada. T72 é pesquisa independente; não é dependência para validar a utilidade da base local e não autoriza contratar/conectar.

| ID | Dependências | Requisitos | Responsável lógico | Entrega pequena | Aceite / evidência mínima |
|---|---|---|---|---|---|
| T64 | — | PF-01, PRD-01, PRD-06 | Planejamento | Fechar contrato PF e respostas sintéticas | Bradesco/Mercado Pago PF, cobertura da API registrada, sem conteúdo real em ferramentas |
| T65 | T64 | PF-08, PRD-04, SEC-09, SEC-10, SEC-18 | Pesquisa | Validar runtime privado e instalação/custo antes de uso real | Compatibilidade de SQLCipher/Face ID documentada; Expo Go somente sintético; sem contratação implícita |
| T66 | T65 | PF-03, PF-04, AUTH-01, AUTH-03, AUTH-04, AUTH-06, AUTH-07, SEC-06 | Acesso | Provar chave, senha local, biometria e perda de acesso com sintéticos | Sem senha em claro/chave fixa; fallback/lock/reset não liberam banco antigo; sessão remota da ponte validada separadamente |
| T67 | T65, T66 | PF-02, PF-03, AUTH-02, AUTH-05, AUTH-08, SEC-07, SEC-08, SEC-11, SEC-12, SEC-14 | Dados | Implementar repositório local protegido e ciclo de vida | Arquivo/journal/temporários/backup avaliados com sintéticos; bloquear e apagar sem manter conteúdo reutilizável |
| T69 | T67, T22, T23 | PF-06, PRD-02, PRD-03, EXP-02, EXP-03, EXP-04, EXP-05, EXP-06, EXP-07, PORT-01, PORT-02, PORT-03, PORT-04, PORT-05, PORT-06, PORT-07 | Domínio | Reaproveitar cálculos financeiros em fontes locais | Transferências/estornos/cofrinhos reconciliados; produto ausente sem preencher saldo; correções preservadas |
| T70 | T66, T69 | RPT-01, RPT-02, RPT-03, RPT-04, RPT-05, RPT-06, RPT-07, RPT-08, UX-01, UX-02, UX-03, UX-04, UX-05 | UI | Montar gestão e relatórios internos com detalhe progressivo | Resumo/filtros/drill-down acessíveis e reconciliados com sintéticos, fonte/data/parcialidade claras |
| T71 | T67, T70 | SEC-01, SEC-02, SEC-03, SEC-05, SEC-09, SEC-10, SEC-11, SEC-12, SEC-13, SEC-15, SEC-16, SEC-17, PF-02, PF-08 | Validação | Validar exposição e dispositivo na arquitetura local | Rede/log/arquivo/cache/captura/update testados com sintéticos; ferramentas continuam sem conteúdo real |
| T72 | T64 | PF-07, OF-01, OF-02, OF-03, OF-04, OF-06, OF-07, OF-08, OF-09, SEC-04, PRD-05 | Pesquisa | Fechar elegibilidade PF oficial de cada API sem ativar conexão | Custo/scopes/certificado/cobertura/revogação comprovados ou limitação explícita; nenhuma credencial no app |
| T73 | T71 | PF-01, PF-06, PF-08, PRD-06, PRD-07, PRD-08, SEC-17, SEC-18 | Validação | Registrar aceite da capacidade local no iPhone e pendências da automação | Titular valida privadamente, sem enviar extrato ao desenvolvimento; app local não recebe selo de Open Finance completo |

## Microtasks Meu Pluggy — revisão 0.4

| ID | Dependências | Requisitos | Responsável lógico | Entrega pequena | Aceite / evidência mínima |
|---|---|---|---|---|---|
| T74 | — | MPG-01, MPG-02, MPG-03, MPG-07 | Planejamento | Fechar contrato do proxy/ponte e revisar tasks reaproveitadas | Cadastro privado, sessão, vínculos, destinatários, custo, retenção e limites definidos antes de código |
| T75 | T74, T18, T55 | MPG-02, MPG-03, MPG-06 | Validação | Testar acesso em rotas financeiras/status/configuração | Sem sessão/expirada, dono incorreto e item/conta trocado negados antes da consulta; não expor existência de secrets |
| T76 | T74, T19, T21, T22 | MPG-04, MPG-08 | Integração | Validar proxy pessoal e estados com fixtures | IDs permitidos, cadência diária, ausência de refresh/listagem, indisponibilidade e revogação respeitados |
| T77 | T74, T23, T24, T76 | MPG-05, MPG-08 | Validação | Preparar matriz Bradesco/MP e homologação privada | Cofrinho ausente/conta sem movimentos não viram zero; fontes/datas e dupla contagem testadas sinteticamente; cobertura real ainda pendente |
| T78 | T63, T75, T76, T77 | MPG-06, MPG-07, MPG-08 | Validação | Consolidar decisão de prontidão para primeiro consentimento | Evidências de segredos/logs/dependências/revogação e risco residual revisadas; nenhuma falha alta/crítica aberta da integração; depois comparar cobertura privadamente |

T78 não declara cobertura real antes do primeiro consentimento: T41/T42 passam a exigir T78 antes de acessar dados reais e registram a comparação privada depois. A release T45 exige essa comparação e cobertura explícita; registrar redução de escopo se cofrinhos não retornarem, sem declarar o objetivo original completo. Pesquisa pública não conclui T75–T78.

## Evidência T74 — done

Contrato em [T74-BRIDGE-CONTRACT](../plan/T74-BRIDGE-CONTRACT.md), base d2dec67, requisitos MPG-01/02/03/07 e specs correlatas. Apenas documentação alterada, sem endpoint/backend provisionado. Critérios de arquitetura/segredos/autorização/retencão/custo definidos; viabilidade Open Finance pessoal por banco continua em T03/T77, sem promessa de acesso real. Dependência de release em Inter/Nubank removida; webhook deferred não bloqueia a versão inicial. Próxima task T01.

## Evidência T01 — done

[Runtime e estrutura](../plan/T01-RUNTIME-STRUCTURE.md), base 6058f29, requisito PRD-04. Proprietário confirmou iPhone 11/iOS 26.6.2/Expo Go 57.0.9/SDK 57.0.0. Selecionados SDK57 e Node22.23.2/npm12.2.0 locais; matriz de limitações e paths futuros definidos. Sem instalar dependências ou abrir app. Próxima task T02; T07 continua responsável pelo bootstrap e smoke no aparelho.

## Evidência T02 — done (spike sintético)

Base 2a8ef01. spikes/access/session.mjs e session.test.mjs; Node22 nativo, 20 testes passaram, sem dependências. Critérios AUTH-01/03/04/06 testados por porta fake, incluindo races e recuperação. [Evidência/limites](../plan/T02-ACCESS-SPIKE.md). Não equivale a login real ou teste no aparelho. Próxima T03.

## Evidência T03 — done (pesquisa)

[Viabilidade pessoal](../plan/T03-PERSONAL-FEASIBILITY.md): termos/cotas/cadência documentados, limites registrados. Aplicabilidade Open Finance de Bradesco/MP no canal pessoal continua pendente do gate real. Sem contratar ou consentir. Próxima T04.

## Evidência T04 — done

[Contrato financeiro](../plan/T04-FINANCIAL-CONTRACT.md), 14 casos inteiramente sintéticos em tests/fixtures/financial-cases.json. Contrato de centavos, mês, estornos, moedas e sobreposição definido; JSON parseado. Cálculos ainda não implementados (T24/T26). Próxima T05.

## Evidência T05 — done (wireframe)

[Wireframe local](../docs/design/wireframes.html) e [evidência](../plan/T05-WIREFRAMES.md). Cinco fluxos com estados, ocultação, filtro e período persistido na navegação. Sintaxe JS validada; sem navegador/aparelho homologado. Próxima T47 (prerequisito de T06).

## T47 — done como decisão de escopo

[Evidência](../plan/T47-VENDOR-GATE.md). Pesquisa/arquitetura sintética concluída; uso financeiro real bloqueado. Nenhum serviço ou credencial provisionado. Próxima T48.

## T48 — done como decisão de escopo

[Evidência](../plan/T48-TRUST-KEYS.md). Pesquisa/arquitetura sintética concluída; uso financeiro real bloqueado. Nenhum serviço ou credencial provisionado. Próxima T49.

## T49 — done como decisão de escopo

[Evidência](../plan/T49-RUNTIME-GATE.md). Pesquisa/arquitetura sintética concluída; uso financeiro real bloqueado. Nenhum serviço ou credencial provisionado. Próxima T06.

## Evidência T06 — done (R1 sintética)

[Prontidão](../plan/T06-R1-READINESS.md). Dependências revisadas, specs ready apenas para preparação sintética. Gate real e cobertura bancária permanecem pendentes. Próxima T07 bootstrap SDK57, sem dados reais.

## T07 — review

[Bootstrap](../plan/T07-BOOTSTRAP.md): typecheck,20 testes, compatibilidade,Doctor21/21,export iOS e Metro/status passaram. Smoke físico solicitado, aguardando titular. Auditoria com18 altos transitivos sem patch, gate real bloqueado. Para T09, a dependência T07 requer os artefatos locais verificados; confirmação física continua pendente e não bloqueia configurar checks de CI. Próxima task local T09; T08 remota ainda não provisionada.

## T09 — review

Workflow implementado com SHAs oficiais e sem secrets/deploy. Typecheck +29 testes +YAML +audit passaram localmente; primeira execução remota pendente após push. [Evidência](../plan/T09-CI.md). T07 continua aguardando confirmação física do QR enviado.

## T09 — done

CI do commit e7677f4 concluída com success: https://github.com/yurilopesmdv/orbe-finance/actions/runs/38957346131. T07 permanece review por carregamento infinito relatado no iPhone; resolver conectividade antes de próximas tasks.

## Ajuste de validação física

Usuário adiou o teste do app para o fim. T07 done quanto à implementação/checks; teste físico permanece pendente em T38/T45 e não bloqueia tasks locais. Nenhum firewall alterado; script de diagnóstico preparado foi removido antes de aplicação. T09 done com CI remota aprovada. Próxima T08.

## T08 — blocked, trabalho independente segue

CLI publica Mailpit fora do loopback nesta instalação; launcher detecta e para só o Orbe. Config/migration preparadas, sem remoto. Pedido assíncrono de credencial própria registrado; nenhum banco conectado. T26/T24 foram ajustadas para depender de T04: são funções puras com contratos/fixtures e não precisam aguardar implementação de ingestão/SQL. Integração dessas funções com dados reais continua nas tasks de ingestão e validação, sem antecipar cobertura. Próxima T26.

## T26 — done

[Domínio de gastos](../plan/T26-EXPENSE-DOMAIN.md): dinheiro/datas/despesas em TS puro;18 casos novos passaram e total47 testes. Sem backend ou conta real. Próxima T24 (reconciliação pura), conforme dependência T04 ajustada.

## Pausa solicitada —16/10/2026

Usuário pediu standby até amanhã, salvar progresso e atualizar Git. Execução pausada; nenhuma retomada automática.47 testes e CI do29640f8 aprovados. T24 ainda não iniciada e é próxima local após nova autorização; T08 depende de credencial/configuração pendente. Serviços Orbe parados; teste físico adiado para T38/T45. Estado consolidado em roadmap/STATE.md.

## T24 — done (19/10/2026)

[Reconciliação da carteira](../plan/T24-PORTFOLIO-DOMAIN.md): 19 testes novos, 66 no total e TypeScript aprovados. Retomada autorizada pelo usuário; pausa anterior encerrada. Próxima T25, domínio puro de classificação; T08 continua pendente. Git local reparado com hashes verificados, conforme relatório de validação.

## T25 — doing (19/10/2026)

Domínio puro depende de T04/T26; T14/T22 continuam necessários à integração, sem bloquear regras sintéticas. Contrato SPEC-003 atualizado antes de código.

## T25 — done

[Classificação pura](../plan/T25-CLASSIFICATION-DOMAIN.md) validada: 84 testes totais e TypeScript aprovados. Próxima T28, shell exclusivamente sintético; autenticação real T12 permanece gate de integração.

## T28 — doing

Shell demonstrativo depende de T05/T07; T12 continua obrigatória para dados privados. Contrato SPEC-005 atualizado antes de código. Nenhum login fictício.

## T28 — done

[Shell demonstrativo](../plan/T28-DEMO-SHELL.md): quatro abas, componentes reutilizáveis e sete estados explícitos. TypeScript, 84 testes e bundle iOS aprovados. Próxima T27a: consulta local pura; T27b ponte autenticada segue bloqueada por backend.

## Decomposição T27 (antes de implementação)

- T27a: T24/T25/T26/T28, consultas locais puras sobre lote sintético classificado; paths src/data/local, tests/data. Aceite: filtros/paginação/total/moeda/completude e identidade consistentes, sem rede.
- T27b: mantém T17/T21/T22/T23, ponte autenticada e isolamento real; bloqueada por T08. T27 completa somente após ambas.

T29–T31 podem ter demonstração com T27a; integração real continua exigindo T27b e autenticação. Não marcar tarefas completas por demonstração.

## T27a — done

[Consultas locais](../plan/T27-LOCAL-QUERIES.md): TypeScript e 95 testes aprovados. T27b pendente; T27 não concluída integralmente. Próxima T29a: visão geral demonstrativa com dados inventados, sem persistência financeira.

## Decomposição T29

T29a (T24/T26/T27a/T28): resumo sintético com fonte/data/parcialidade e ocultação visual/acessível. T29b mantém T27b e autenticação, preferência persistente e homologação física. T29 só completa com ambas. Próxima implementação T29a, paths src/data/demo, src/components/privacy.tsx, overview e root layout.

## T29a — done

[Resumo demonstrativo](../plan/T29-OVERVIEW.md): cálculos compartilhados, fontes/datas/parcialidade, valores ocultos por padrão e ao background. TypeScript, 97 testes e exportação iOS passaram. T29b pendente. Próxima T30a, lista e revisão volátil dos exemplos.

## Decomposição T30

T30a (T25/T26/T27a/T28/T29a): filtros, páginas e detalhe dos exemplos com overrides em memória. T30b exige T27b e persistência privada, sync real e validação física. T30 só completa com ambas. Paths lista, src/data/demo/store.tsx, domínio demonstrativo e testes.

## T30a — done

[Lista demonstrativa](../plan/T30-MOVEMENTS.md): filtros, paginação, detalhe e correção em memória compartilhada. TypeScript, 99 testes e bundle iOS aprovados. T30b continua pendente; próxima T31a, carteira sintética.

## Decomposição T31

T31a: T24/T27a/T28/T29a, carteira demonstrativa por instituição e componente, sem inventar disponível/retorno. T31b: T27b e integração real de contas/posições, autenticação e validação física. T31 só completa após ambas. Paths carteira, metadados inventados do cenário, testes e checkpoints.

## T31a — done

[Carteira demonstrativa](../plan/T31-PORTFOLIO-UI.md): filtros por instituição, contas/investimentos/reservas separados, datas e valor desconhecido explícitos. TypeScript, 100 testes e bundle iOS passaram. T31b pendente. Próxima T57a: relatório local puro, depois T58a acesso demonstrativo.

## T08 — done via cloud (19/10/2026)

[Backend próprio](../plan/T08-LOCAL-BACKEND.md): projeto novo do usuário confirmado vazio, baseline aplicada uma vez, política Auth restrita e schema privado negado aos papéis clientes. Reexecução idempotente aprovada; TypeScript/107 testes/bundle iOS passaram; token administrativo ausente no bundle. Alternativa local continua bloqueada. Prioridade passou à T10 porque o usuário forneceu credenciais; T57a ainda não iniciada.

## T10 — doing

[Plano de proprietário](../plan/T10-OWNER-ACCESS.md), contrato SPEC-001 definido antes de SQL. Cadastro da identidade/senha solicitado diretamente no painel; continuar deny-by-default e testes sintéticos enquanto aguarda UUID privado.

## T10a — done; T10b pendente

Registro privado/função de autorização aplicados; testes reais com rollback e dois usuários inventados passaram, nenhum resíduo. TypeScript/109 testes locais aprovados. T10b = cadastrar usuário no painel e provisionar UUID privado; solicitado ao titular. T11a cliente de autenticação pode ser preparado contra contrato fail-closed; T11b login efetivo exige T10b.

## Decomposição T11

T11a (T07/T10a): gateway REST Auth com testes de transporte sintético. T11b (T10b/T11a): configuração pública, telas, sessão/recuperação efetiva e entrega do código. T12 exige T11b e valida bloqueio. T11 só completa com ambas. Contrato/plano definidos antes do gateway.

## T11a — done

[Gateway Auth](../plan/T11-AUTH-GATEWAY.md): origem/chave pública restritas, verificação do proprietário server-side, token volátil, recuperação/logout e20 testes de transporte inventado. TypeScript/129 testes passaram. T11b depende de T10b (UUID do dono ainda ausente). Continuar T57a local enquanto aguarda, sem bloquear execução inteira.

## Decomposição T57

T57a: T24/T26/T27a, agregações locais puras compartilhadas com a lista. T57b: mantém T27b, integração privada/autorização e teste de saídas. T57 completa somente com ambas. Contrato SPEC-007 definido antes de código; próxima T58a integra relatório demonstrativo à navegação.

## T57a — done

[Relatórios locais puros](../plan/T57-LOCAL-REPORTS.md): TypeScript/137 testes aprovados, incluindo8 cenários de reconciliação e paginação>100. T57b pendente. Próxima T58a, navegação de relatório demonstrativo e detalhe mantendo filtros.

## Decomposição T58

T58a: T28/T29a/T57a, acesso secundário a relatório demonstrativo com detalhe mantendo contexto. T58b exige T29b/T57b e testes privados/físicos. T58 não completa por demonstração; T59/T60 continuam separadas.

## T58a — done

[Relatório demonstrativo](../plan/T58-REPORTS-UI.md): resumo → relatório → categoria, contexto preservado por pilha, filtros permitidos validados, valores ocultos e cálculo compartilhado. TypeScript/139 testes e bundle iOS passaram. T58b/físico pendentes. Próxima T13, vínculos de metadados sob RLS, enquanto T10b aguarda UUID privado.

## T10b — done (provisionamento)

Titular cadastrou identidade no Dashboard e forneceu UUID privado; backend conferiu confirmação/não anonimato e registrou proprietário. Login físico pelo titular permanece na validação de T11/T38. Próxima prioridade T11b, agora desbloqueada; T13 ainda não iniciada.

## T11b — login/logout implementados; T11c pendente

TypeScript/160 testes, bundle iOS e smoke HTTP real de negação com identidade inventada passaram; conta temporária removida. Token administrativo e UUID privado ausentes no bundle. T11c = recuperação efetiva por código, bloqueada por template/SMTP no Free; flag false, sem emails de teste ou contratação. T11 integral continua pendente. Próxima T12a liga AppState à sessão e limpa formulários.

## Decomposição T12

T12a: integração AppState e limpeza de formulário, depende de login T11b (não do SMTP T11c). T12b: homologação física de bloqueio/alternador/retorno, permanece final T38/T45/T53. Face ID deferred conforme runtime; T12 não é prova de proteção nativa completa.

## T12a — done

[Ciclo de vida](../plan/T12-APP-LIFECYCLE.md): AppState bloqueia/cancela e limpa campos; voltar active exige senha. TypeScript/165 testes e bundle iOS aprovados; sem PAT/UUID privado no bundle. T12b físico pendente ao final. Próxima T13: conexões/contas, RLS e vínculo privado, sem valores bancários.

## T13 — doing

Contrato SPEC-002/009 e [plano de metadados](../plan/T13-CONNECTION-METADATA.md) definidos antes da migration. Só relações/capacidades/datas sob RLS; IDs externos privados, zero payload financeiro.

## T13 — done

[Metadados sob RLS](../plan/T13-CONNECTION-METADATA.md): migration aplicada e SQL real com duas identidades/anon/CRUD/FKs/join/agregados aprovado. Rollback sem resíduos e dono preservado; reexecução de três migrations conferiu hashes sem duplicar. TypeScript/165 testes locais passaram. Nenhum item bancário real. Próxima T14a, repositório volátil com escopo de sessão e overrides; persistência privada permanece gate de runtime.

## Decomposição T14

T14a: ledger volátil com guard principal/geração, promoção de lote completo e classificação separada; depende T13/T07/T25/T26/T27a. T14b: persistência privada/runtime e principal Auth real, depende dos gates de armazenamento (T65+) e integração. T14 não completa por memória sintética. Contrato/plano definidos antes de código.

## T14a — done

[Ledger volátil](../plan/T14-VOLATILE-LEDGER.md): TypeScript/179 testes aprovados. Promoção atômica escopada, preservação de overrides/moedas e purga por sessão testados. T14b persistente/real permanece pendente; T14 integral não concluída. Próxima T15a: snapshots voláteis de ativos/posições e relações, sem persistir finanças reais.

## Decomposição T15

T15a: snapshots de ativos voláteis com guard compartilhado, depende T13/T24/T14a. T15b: persistência privada e integração protegida depois dos gates T65+. T15 não completa por memória sintética; normalização/cobertura de fonte continua T21/T23.

## T15a — done

[Snapshots voláteis](../plan/T15-VOLATILE-ASSETS.md): TypeScript/189 testes aprovados; guard compartilhado preserva testes do ledger. T15b privado pendente. Encontrado arredondamento de1 centavo no formatter atual em MAX_SAFE_INTEGER; próxima microtask T26b de apresentação monetária exata antes de T16a.

## T26b — doing

Microtask de correção identificada na validação: formatter Number/100 perde centavo no limite seguro. SPEC-003 e plano definidos antes do helper; não muda cálculo ou layout.

## T26b — done

[Precisão monetária](../plan/T26b-MONEY-DISPLAY.md): formatter exato sem Number/100 fracionário, negativo menor que1 preservado, moeda/ocultação/ausência explícitas. TypeScript/195 testes e bundle iOS aprovados. Próxima T16a de alocações virtuais, sem movimentação bancária.

## Decomposição T16

T16a: metas/alocações voláteis sobre orçamento explícito, depende T15a/T24. T16b: transações privadas/persistência/ligação a fonte real e validação concorrente nativa, depende T15b/gates T65+. T16 não completa pela simulação JS.

## T16a — done

[Metas voláteis](../plan/T16-VOLATILE-GOALS.md): TypeScript/207 testes passaram, limites/sessão/moeda/qualidade e concorrência JS cobertos. T16b privado pendente. Próxima T32a: tela demonstrativa de metas, usando orçamento inventado e labels sem movimentação bancária.

## Decomposição T32

T32a (T16a/T24/T31a): tela/seed demonstrativos de metas com parser exato e reset de sessão. T32b: fonte real, vínculo a reserva existente, persistência/autorização privada e físico, depende T16b/T31b/gates. T32 integral continua pendente.

## T32a — done

[Metas demonstrativas](../plan/T32-DEMO-GOALS-UI.md): criar/alocar/desvincular/excluir por tela secundária da Carteira, contexto/reset da sessão, orçamento explícito sem alterar patrimônio. TypeScript/212 testes e bundle iOS aprovados; valores privados ausentes nos artefatos. T32b/físico pendentes. Próxima T51a: endurecer tipos escalares de referências antes da ponte, depois T18a.

## Decomposição T51

T51a: referências escalares canônicas em runtime, depende de T24/T26/T14a/T15a. T51b mantém dependências T18/T49 e valida URLs/redirects/conteúdo da ponte. T51 completa somente com ambas. Spec/plano definidos antes da correção.

## T51a — done

[Referências escalares](../plan/T51a-SCALAR-REFERENCES.md): TypeScript/216 testes passaram, incluindo canários que não são promovidos/retornados em lotes inválidos. T51b SSRF/URLs segue pendente. Próxima T50a de isolamento de credenciais do root Metro; depois T18a.

## T50a — doing

[Isolamento de segredos](../plan/T50a-DEVELOPMENT-SECRETS.md), SEC-19, depende T08/T51a. Integrador único, paths e aceite no plano. Separar credenciais do grafo Metro e provar com crawler/canários. T50b será launcher/perfil Expo antes de qualquer LAN; T50 integral segue pendente.

## T50a — done

Credenciais preservadas fora do root Expo, ponteiro estrito e exclusões do grafo comprovadas pelo crawler real com canários. TypeScript/224 testes/export iOS/scan privado passaram. Próxima T50b: ambiente e perfil do CLI separados antes de LAN; depois T18a.

## T50b — doing

[Processo Expo](../plan/T50b-EXPO-PROCESS.md), depende T50a; SEC-20. Sanitizar ambiente, dotenv estrito/perfil exclusivo/offline; validar por sentinelas e export, sem abrir LAN.

## T50b — done

Launcher e export passam por processo com allowlist, public dotenv estrito, perfil exclusivo e CLI offline/sem telemetria. TypeScript/234 testes/export iOS/scan aprovados. T50 não homologa runtime/dados reais; próxima T18a, handler HTTP sintético desligado.

## Decomposição T18

T18a: núcleo HTTP/ports sintéticos e gate desligado, depende T13/T50a/b. T18b: adapters reais Auth/metadados/RLS, runtime Deno e deploy desligado validado. T18c: provedor/provisionamento privado e OF comprovado, depende T03/T63. Não marcar T18 completa pela fatia sintética.

## T18a — doing

[Contrato do núcleo](../plan/T18a-BRIDGE-CORE.md), MPG-09. Implementar e validar sem endpoint publicado nem API externa.

## T18a — done

Núcleo desligado por padrão, status autorizado/projeção estrita,16KiB/20s e cancelamento validados. Typecheck cliente/ponte e255 testes aprovados (21HTTP novos). Sem deploy/adapters externos. T18b decomposta em T18b1 REST Auth/metadados local e T18b2 runtime Edge/deploy desligado; T18c segue bloqueada pelos gates.

## T18b1 — doing

[Portas REST](../plan/T18b1-REST-PORTS.md): origem/projeção fixas, token explícito por requisição, Auth/RPC/RLS simulados. Sem deploy/Deno/bancos.

## T18b1 — done

Portas REST sem estado de sessão compartilhado, Auth+RPC e select RLS de origem fixa. TypeScript cliente/ponte e272 testes aprovados,17REST novos. Sem endpoint/consulta de usuário real. T18b2 runtime/deploy desligado pendente; próxima T33a guia e estados desconectados, independente da integração.

## Decomposição T33

T33a (T28/T11b): tela informativa desconectada e acesso/guia sem rede. T33b (T19/T20/gates): status reais, retorno/consulta/cooldown e ações de pausa. T33 integral segue pendente.

## T33a — doing

[Guia desconectado](../plan/T33a-DISCONNECTED-CONNECTIONS.md), OF-10. Preservar abas e corrigir mensagens desatualizadas de acesso na interface.

## T33a — done

Guia/tela desconectada e mensagens de acesso corrigidas sem mudar abas. TypeScript cliente/ponte,272 testes existentes/export iOS/scan privado aprovados. T33b conexões reais pendente; próxima T18b2 runtime/deploy desligado, começando pela revisão do contrato oficial.

## T18b2 — doing

[Runtime desligado](../plan/T18b2-DISABLED-RUNTIME.md), MPG-11. Publicar somente503 sem ler env/metadata/Auth; sem Deno local/Docker/fornecedor. Validar guardas/HTTP gerenciado.

## T18b2 — done

Runtime gerenciado desligado validado em três HTTP anônimos503; função própria versão1, gate literalfalse, sem env/dados.279 testes/typecheck passaram. Adapters ativos/ponte completa continuam pendentes (T18b3/T18c/gates). Próxima T59a filtros avançados/conta e preservação do contexto na demo.

## T59a — doing

[Filtros da demo](../plan/T59a-ADVANCED-FILTERS.md), RPT-09; depende T30a/T57a/T58a. T59b fontes reais/persistência e físico seguem pendentes.

## T59a — done

Filtros por conta/tipo/categoria e resumo visível, contexto/pai preservado no detalhe. TypeScript cliente/ponte e283 testes/export iOS/scan passaram. T59b privado/físico pendente. Próxima T60a comparação pura com base zero/período aberto/parcial/sem histórico explícitos.

## Decomposição T60

T60a comparação mensal pura de observações explícitas; T60b UI/fixtures e avisos por estado; T60c composição/evolução por snapshots existentes sem inventar rentabilidade. Privado depende gates.

## T60a — doing

[Comparação mensal](../plan/T60a-MONTH-COMPARISON.md), RPT-10, depende T26/T57a. Sem histórico ou UI inventados nesta task.

## T60a — done

Comparação mensal pura de observações explícitas, BigInt e razão/partialidade honesta. TypeScript cliente/ponte e297 testes aprovados (14novos). Roadmap ativo atualizado. Próxima T60b UI/fixtures de comparação; T60c evolução/composição e privado seguem pendentes.

## T60b — doing

[Comparação demonstrativa](../plan/T60b-COMPARISON-UI.md), RPT-11. Filtros preservados e histórico apenas explicitamente inventado; sem novas consultas.

## T60b — done

Comparação ligada aos filtros da demo, fonte/cobertura/null e ocultação explícitos. TypeScript cliente/ponte e307 testes/export iOS/scan passaram. T60c decomposta em c1 composição por fonte/classe sem duplicidade e c2 evolução apenas com snapshots existentes. Próxima T60c1.

## T60c1 — doing

[Composição conhecida](../plan/T60c1-PORTFOLIO-COMPOSITION.md), RPT-12, depende T24/T31a. T60c2 evolução por snapshots existentes fica separada; sem inventar histórico.

## T60c1 — done

Composição do subtotal conhecido por banco/classe reconciliada, shares100% e sem duplicidade. TypeScript cliente/ponte e320 testes/export/scan aprovados. T60c2 evolução exige snapshots, não fabricados. Próxima T19a estados/capacidades e autorização de leitura por produto em domínio puro.

## Decomposição T19

T19a política/normalização pura do DTO interno; T19b mapeamento comprovado do fornecedor e integração server-side após contratos/gates. T19 integral segue pendente.

## T19a — doing

[Estados de conexão](../plan/T19a-CONNECTION-STATE.md), OF-11. Sem rede; produto desconhecido ou gate desligado não gera leitura.

## T19a — done

Estados/capacidades e política de leitura puros, sem rede, schema/projeção/gates validados. TypeScript cliente/ponte e332 testes passaram (12novos). T19b fornecedor/adapter pendente. Próxima T20a lease/cooldown/revisão no backend somente metadados.

## Decomposição T20

T20a lease/cooldown/fencing somente metadata no banco; T20b coordenação/paginação no adapter com fixtures; integração real depende contratos/gates. T20 integral segue pendente.

## T20a — doing

[Lease privado](../plan/T20a-READ-LEASES.md), OF-12. Migration nova e testes rollback sem banco conectado/valor financeiro.

## T20a — done

Migration4 de lease/cooldown/fencing aplicada, SQL service/auth/anon e regressões reais passaram com rollback/zero fakes/owner preservado.335 testes locais/TypeScript aprovados,3guardas runner novos. T20b subdividida em b1 portas REST lease e b2 coordenação/paginação com fixtures. Próxima T20b1; T20 integral não completa.

## T20b1 — doing

[Portas REST lease](../plan/T20b1-LEASE-REST.md), OF-13. Modern secret somente backend/fixtures, lazygate e transporte limitado; sem buscar chave real ou redeploy.

## T20b1 — done

Portas REST de lease lazy/server-only, deadline/cancel/schema/sem segredo emURL,353 testes/typecheck aprovados (18novos). JSONbounded compartilhado e origemprimitiva rígida; allowlist5fontes. Nenhum segredo real lido/redeploy; próxima T20b2 coordenação/paginação com fixtures.

## T19b1 — doing (antes de T20b2)

[Autorizações independentes](../plan/T19b1-SEPARATE-CONSENTS.md): revisão oficial identificou guarda necessária contra coleções vazias por expiração. Decomposição T19b1 metadata/gates; T19b2 adapter fornecedor/OF comprovado continua futura. Não inicia banco real ou usa credenciais novas.

## T19b1 — done

Consentimentos distintos e gate de proxy desconhecido/vencido aplicados em migration5.359 testes/typecheck e SQL lease/metadados/proprietário reais aprovados com rollback/zero fakes/owner preservado. Nenhum fornecedor acessado. Retomar T20b2; T19b2 adapter originalOF e revisão SEC05/upstreamURL ainda pendentes.

## T20b2 — done

[Coordenação com fixtures](../plan/T20b2-BATCH-COORDINATION.md), OF-15/AUTH-09. Recibos metadata/staging local, guard no commit, sem normalizador real/endpoint/segredo.

T20b2:381 testes, typechecks e export iOS aprovados. Coordenador metadata-only, deadline/cancelamento e guard de commit preservam último lote válido; normalizadores T21–23 e transporte financeiro continuam futuros.

## T21 — decomposição

- T21a done: normalizador de DTO interno de contas com fixtures; [plano](../plan/T21a-CANONICAL-ACCOUNTS.md), OF-16.
- T21b done: staging completo com coordenador/MemoryAssets, sem backend ativo.
- T21c pending: adapter fornecedor, vínculos administrativos e cobertura por banco, após gates. T21 só completa depois das três.

T21a:396 testes e typechecks aprovados. DTO mínimo de contas com vínculo explícito, centavos/data/null, projeção sem PII e dedupe; mapeamento Pluggy e staging ainda pendentes. Próxima T21b.

T21b:412 testes/typechecks aprovados. Staging de contas de uso único integrado por fixtures ao coordenador e MemoryAssets. T21c continua pendente por fonte/OF/gates. Próxima T22a DTO canônico de movimentos, independente do fornecedor.

## T22 — decomposição

- T22a done: DTO interno canônico por conta/mês, [plano](../plan/T22a-CANONICAL-MOVEMENTS.md), EXP-10.
- T22b done (fixtures): subdividida em T22b1/b2, publicação atômica/staging completo, atualizações/cancelamentos e preservação de overrides/ausentes.
- T22c pending: adapter fornecedor, identidade estável/janela incremental/reconciliação de período e cobertura, após gates.

T22a:432 testes/typechecks aprovados. Próxima T22b1: promoção atômica do ledger para várias contas do mesmo lote/mês; T22b2 staging depois. A store atual só promove uma conta por chamada e não deve ser anunciada como transação de produto multi-conta.

### T22b — subdivisão por atomicidade

- T22b1 done: promoção multi-conta atômica no MemoryLedger, [plano](../plan/T22b1-ATOMIC-LEDGER.md).
- T22b2 done: staging de produto paginado usando publicação atômica; nenhuma sequência de commits por conta é considerada atomicidade de produto.

T22b1:443 testes/typechecks, promoção multi-conta atômica implementada. Próxima T22b2 staging de movimentos por conexão/mês com manifesto explícito de contas e paginação global; ausência de conta/página não comprova cobertura.

T22b2:461 testes/typechecks aprovados; manifesto de contas e paginação global/porconta separados, publicação única protegida. Comprovação de transferência vinculada ao par conta/movimento. Próxima T23a contrato canônico de investimentos/reservas com fixtures; T22c fornecedor/janela real permanece futuro.

## T23 — decomposição

- T23a done: normalizar posições/reservas internas, [plano](../plan/T23a-CANONICAL-POSITIONS.md).
- T23b1 done: conservar metadados explícitos bruto/líquido/base/classe no cache volátil.
- T23b2 done: staging completo de posições/reservas, sem perder valuation.
- T23c pending: adapter fornecedor e cobertura/homologação por banco após gates.

T23a:476 testes/typechecks; DTO de posições/reservas preserva bruto/líquido/base/classe e relações explícitas. T23b1 próximo: cache deve conservar/validar valuation antes do staging; não afirmar cache completo por DTO apenas.

T23b1:483 testes/typechecks; cache projeta quatro campos de valuation com validação conjunta e dedupe completo. Próxima T23b2 staging de investimentos/reservas usando normalizador concreto e cache com valuation.

T23b2:493 testes/typechecks; engine interno compartilhado por factories concretas de contas e posições, sem função recebida por transporte. Staging de valuation/ciclos/ausência validado. Próxima T36a revisão e coordenação sintética do conjunto de produtos; fonte real T21c/T22c/T23c continua pendente.

## T51c — done (achado antes de T36a)

[Transporte Auth](../plan/T51c-AUTH-TRANSPORT.md), AUTH-10. Fechar cap de JSON/configuração mutável; transporte Expo streaming em Provider. T36a coordenação de produtos continua posterior. Não há evidência de vazamento.

T51c:506 testes/typechecks, export iOS e scan de segredos aprovados. Config Auth capturada, JSON limitado antes do parse, Provider expo/fetch e body rejeitado cancelado. Teste físico/redirect/cookies/cache nativo seguem pendentes. Retomar T36a.

## T36 — decomposição

- T36a done: roteamento concreto de produtos com fixtures, [plano](../plan/T36a-PRODUCT-ROUTING.md), OF-18.
- T36b done: ciclo de vida de caches/geração e bloqueio imediato sob sessão, sem expor credenciais.
- T36c pending: transporte real e política de retomada/backoff após gates/fonte homologada.

T36a:518 testes/typechecks; roteamento concreto dos produtos e publishedProducts explícito validados. Nenhum módulo novo conectado à UI/Auth/fornecedor. Próxima T36b ciclo de vida dos caches.

T36b:531 testes/typechecks; controller privado de caches por sessão, cancel/purge/novo escopo e concorrência validados com SessionModel inventado. Gerador real/integração UI/runtime/fornecedor continuam futuros. Próxima T37a revisar/spec operações server-side de pausa/remoção de metadata.

## T37 — decomposição

- T37a done: controles server-side de metadata com sessão/reautenticação, [plano](../plan/T37a-CONNECTION-CONTROLS.md), OF-19.
- T37b pending: comandos locais/cancelamento/cachepurge e UI privada depois dos gates.
- T37c pending: retomada com status fresco e revogação/exclusão no fornecedor, sem confundir operações.

T37a:535 testes/typechecks e SQL real com rollback/zero fakeusers+sessions/owner preservado. Migration6 imutável; pausa/fence e remoção com revisão/sessão/senha recente somente metadata. Próxima T37b1 porta cliente fechada para RPCs, em fixtures/desligada; UI/cachepurge T37b2 posterior.

### T37b — subdivisão

- T37b1 done: porta cliente de comandos em fixtures/desligada, [plano](../plan/T37b1-CONNECTION-COMMANDS.md), OF-20.
- T37b2 pending: lifecycle/purge e confirmação na UI privada depois de contratos/gates.

T37b1:551 testes/typechecks/export iOS/scan aprovados. Porta cliente desligada, SessionModel.read e destino ligado à origem pública de login. Próxima T51d: fechar revogação de sessão em leituras RLS/metadata antes de UI/endpoint ativo; T37b2 continua posterior.

## T51d — done

[Sessão ativa na leitura](../plan/T51d-METADATA-SESSION-GATE.md), SEC-21. Nova migration7 futura; seis anteriores imutáveis. Reforçar RLS/bridge sem ativar endpoint; teste read-only positivo depois de fixtures/rollback.

T51d:556 testes/typechecks e SQL real metadataREADONLY+/revogação/controls; migration7 imutável, zero fakes/owner preservado. Bridge passa a exigir RPC bool de sessão em source, endpoint publicado permaneceoffv1 (sem redeploy). Próxima T18b3a planejar runtime de metadata autenticada separado de ingestão, antes de UI privada.

## T18b3 — decomposição

- T18b3a done: factory de runtime metadata-only, MPG-12/ADR-012; [plano](../plan/T18b3a-METADATA-RUNTIME.md), integrador único; depende T18b1/T51d; aceite zero rede off/config inválida e Auth+RLS em fixtures.
- T18b3b pending: entrypoint/deploy separado com manifest/config pública revisados; depende T18b3a. Não ativar ingestão nem reutilizar gate financeiro.

T18b3a:562 testes/typechecks passaram; factory metadata-only local, configuração capturada/falha fechada e guards do deploy desligado preservados. Nenhum deploy/rede bancária. Próxima T18b3b1 entrypoint separado e testes host; T18b3b2 configuração/manifest/deploy posterior.

### T18b3b — subdivisão

- T18b3b1 done: entrypoint metadata-only separado, MPG-12a; [plano](../plan/T18b3b1-METADATA-ENTRYPOINT.md); integrador único, depende T18b3a; aceite hostmock e allowlist sem deploy.
- T18b3b2 pending: pesquisa/configuração/manifest/helper de deploy separado; depende T18b3b1; sem consentimento ou rota financeira.

T18b3b1:566 testes/typechecks passaram; entrypoint orbe-metadata local defaultoff, hostmock de configuração/negação e verificação exata dos dois entrypoints. Sem TOML/deploy novo; próximo T18b3b2 revisão operacional/configuração/manifest.

#### T18b3b2 — fatias operacionais

- T18b3b2a done: corrigir prefixo de rota gerenciada antes de deploy, MPG-12b; [plano](../plan/T18b3b2a-HOSTED-ROUTING.md); integrador único; aceite check/negação sem rede.
- T18b3b2b done: helper/manifest/configuração e validação HTTP gerenciada; sem ativar ingestão financeira.

T18b3b2a:567 testes/typechecks passaram. Runtime metadata aceita caminho interno prefixado pela função; core mantém default e captura opção literal no boot. Caminhos alternativos recusados antes de rede. Sem deploy novo. Próxima T18b3b2b helper/configuração/manifest e HTTP gerenciado.

T18b3b2b responsável integrador único; [plano](../plan/T18b3b2b-METADATA-DEPLOY.md); aceite guards/check/HTTP negativo e financeirooff, sem prova HTTP positiva do titular.

T18b3b2b:577 testes/typechecks; orbe-metadata v3 ACTIVE publicado, cinco HTTP negativos/no-store passaram e orbe-bridge continua503 nos três casos. Manifest/log separados privados, config temporária removida; nenhum ownerJWT/saldo/banco consultado. Próxima T33b1 cliente autenticado de status em fixtures; ownerHTTP positivo fica físico final.

## T33b1 — done

Porta cliente de status autenticado OF-21; [plano](../plan/T33b1-CONNECTION-STATUS.md), integrador único; depende T18b3b2b/T51c/T51d; aceite check/projeção/abort sem financeiro ou UI nesta fatia.

T33b1:591 testes/typechecks passaram; porta status desligada por padrão com projeção canonical/limite/ownorigin/cancel/busy. Nenhum HTTP proprietário nem tela ativada. Próxima T37b2a lifecycle de status/controles antes da UI.

### T37b2 — fatias

- T37b2a done: lifecycle metadata-only e abort de comandos, OF-22; [plano](../plan/T37b2a-CONNECTION-LIFECYCLE.md); integrador único; depende T33b1/T37b1; aceite check/lock/late/uncertain.
- T37b2b done: UI privada com confirmação de remoção, status e reautenticação; depende T37b2a. Sem cache financeiro/ingestão.

T37b2a:606 testes/typechecks passaram; controller encerra ao lock/close, limpa metadata antes de ação e exige status fresco após confirmação. Comandos aceitam abort externo, resultados incertos não repetem mutação. Próxima T37b2b UI metadata-only.

T37b2b: [plano](../plan/T37b2b-CONNECTIONS-UI.md), UX-15; integrador único; aceite check/export/scan, teste físico final separado.

T37b2b:611 testes/typechecks, export Hermes iOS2.6MB e scan PAT/ownerUUID aprovados. Tela /my-connections acessível após login, consulta metadata ao foco, cleanup ao blur/lock, confirmação Modal e reautenticação manual. Sem financeiro/biometria; teste físico/VoiceOver/modal positivo fica final. T37b2c integração de cache financeiro futura/gated, não concluída por esta tela. Próxima T11d fechar ativação indevida de recovery antes do checklist de validação final sintética.

## T11d — done

Gate de entrega AUTH-13; [plano](../plan/T11d-RECOVERY-DELIVERY-GATE.md); integrador único; aceite configuração pública nunca ativa recovery e sem alteração/envio Auth. T11c SMTP continua bloqueada.

T11d:613 testes/typechecks passaram; configure-client só lê chave pública/grava recoveryfalse, não altera template/Auth nem envia e-mail. Reconfigurar arquivo com flagtrue voltafalse. SMTP/entrega T11c continuam bloqueados. Próxima T38a consolidação/validação final sintética e roteiro físico final.

## T38 — aceite em duas etapas

- T38a done: fechamento técnico sintético e preparo do teste final, UX-16; [plano](../plan/T38a-SYNTHETIC-ACCEPTANCE.md); integrador único; depende T37b2b/T11d; aceite docs/evidências/Git/QR sem simular físico.
- T38b pending: validação no iPhone do titular, incluindo login positivo, blur/lock e VoiceOver; não abrir banco/consentimento.

T38a:613 testes/typechecks/CI fb80fb8 e export iOS/scan consolidados; Metro compilou bundle dev5.8MB sem PAT/ownerUUID, status/manifest SDK57 locais responderam. QR enviado; titular confirmou carregamento infinito no iPhone. T38b bloqueada no acesso, sem aceite físico. Readonlydiagnóstico: bind*:8083 correto, ufw exige sudo indisponível, ping no IP anterior não respondeu (não prova firewall); titular confirma ExpoGo logado. Nova exigência oficial de mesma conta no CLI documentada; próxima T38c preparar login/online segregados, sem reutilizar perfil F1.

## T44a — done

Publicação remota para ExpoGo, UX-17; [plano](../plan/T44a-EXPO-GO-PUBLICATION.md); integrador único; usuário pediu parar teste LAN e entregar QR hospedado. Metro parado, diagnóstico firewall cancelado. T38c startonline adiado/substituído por login seguro necessário a EAS. Aceite update remoto verificado/QR, nunca só commit Git. Perfil privado Expo atual sem sessão.

T44a publicada: update iOS01a1591f-8433-7135-a8b2-f03fb5c3fbec/grupo7e5f56bd-462c-4adb-b248-3a509cca68c4, preview/exposdk57.0.0/commit0cdec04. Manifest remoto e hash contra export local conferidos; download anônimo de assets negado pela CDN. Titular confirmou execução remota, mas app caiu por scheme ausente; não marcar aceite físico.

## T44b — done

Hotfix UX-18/[plano](../plan/T44b-PUBLISHED-ROUTER-STARTUP.md), integrador único. Corrigir schemeorbe e testar cenário real de resolução de links em produção contra biblioteca instalada; check/export/CI/republicar/QRnovo.

T44b:623 testes/typechecks/export iOS2.6MB passaram. Teste de biblioteca instalada reproduz erro antigo e confirma root/rotas no contexto de produção comschemeorbe. Publicador exige scheme antes de upload. Próximo CI/republicar/novo QR; aceite físico segue pendente.

T44b republicada: update01a15928-0922-76d1-ac22-d49178453a15/grupo26de8237-ff89-4af7-a466-57ce795754e1/commit14635f1, iOS/preview/exposdk57.0.0.623 testes/typechecks/export/CI aprovados. Manifesto remoto confirmado com schemeorbe e hash do HBC igual ao export; QR oficial atualizado em docs/EXPO-PREVIEW.md. T38b aceite físico do hotfix pendente; financeiro real continua gated.

## Retorno físico e novo escopo —20/10/2026

Titular confirmou “funcionou tudo perfeitamente” no QR de T44b. Abertura/funcionamento relatado da prévia aceitos; não inferir captura/VoiceOver/cache nativo individualmente testados. Nova prioridade: criação de conta dentro do app. Cores/identidade visual ficam posteriores. T10c escopo confirmado posteriormente: somente titular agora e outros cadastros desabilitados, backend singleowner; não abrir autorização ou trocar dono silenciosamente.

## T10c — done

Ativação inicial privada AUTH-14/15/ADR-013; [plano](../plan/T10c-PRIVATE-OWNER-ONBOARDING.md). Integrador único; depende gateway/session/owner provisionados e publicação Expo existente. Confirmado pelo titular: somente ele, outros cadastros preparados/desligados; identidade visual posterior. Paths/aceite nas três fatias do plano. Não abrir signups nem trocar owner para resolver primeiro acesso.

T10c checkpoint20/10: AUTH-14/15 + ADR-013; helper privado com 8 testes, tela de ativação e confirmação/limpeza, porta futura desligada com 7 testes. Typechecks e638 testes passaram; export iOS Hermes2.6MB aprovado. Smoke real exclusivamente fictício: generate_link recovery→OTP→senha→logout→login; não owner negado/metadata bloqueada e identidade removida. Owner/senha real intactos, signup continua fechado. Próximo: commit/push/CI/publicação/QR, então código privado.

T10c entregue: commit794f307/CI39420200892 success; update01a15939-90d3-7433-8804-eed6baa9a1b1/grupo62650c45-ab2a-49e4-87f9-f048fee8aefe, QR atualizado e manifesto/hash conferidos. Arquivo de ativação do proprietário gerado privadamente após publicar, sem ler/definir sua senha, conteúdo fora de Git/Metro/chat. Próximo uso é do titular no iPhone: definir senha e login; não declarar aceite físico específico antes do retorno. Cadastro público continua desligado; cores/identidade posteriores.

## T10c — aceite de criação informado pelo titular

20/10/2026: titular confirmou que criou a conta/acesso no iPhone. Não presumir teste de login/status/VoiceOver/captura a partir dessa confirmação. Código temporário já não precisa ser renovado; não consultar senha nem conteúdo do arquivo privado.

## T51b1 — done

MPG-13/SEC-05/12; [plano](../plan/T51b1-PLUGGY-AUTH.md). Integrador único; autenticação server-side isolada, fixtures e chave em memória sem retorno. T51b/T18c inteiras seguem abertas. Titular confirmou orçamento zero e preferência por manter Expo Go; avaliar modo somente memória/senha em T65a, sem prometer FaceID nem aprovar dados reais.

T51b1 evidência: 657 testes/typechecks passaram;19 casos novos de autenticação/isolamento. Nenhuma chamada Pluggy real, SDK financeiro, alteração de entrypoint ou publicação remota. Chave não sai da porta e cache expira119min. Próxima T54a: inventário verificável do bundle e dependências; depois T65a avaliação Expo Go sem custo.

## T54a — done

SEC-23/[plano](../plan/T54a-RUNTIME-DEPENDENCIES.md), integrador único; inventariar grafo do export iOS e separar alcance cliente/ferramentas, sem relaxar audit nem aprovar dados reais.

T54a evidência:664 testes/typechecks passaram. Export JS iOS real privado:1162 fontes/53 pacotes, braces/node-forge ausentes do grafo. Relatório/hashes em ~/.config/orbe-finance/runtime-audit/report.json; mapas privados não publicados. Três nomes virtuais NUL conhecidos do Metro aceitos explicitamente; demais recusados. Não corrige os19 afetados do toolchain nem prova o binário Expo Go. Próxima prioridade do titular: T12b sessão persistida segura sem salvar senha, mantendo Expo Go/orçamento zero.

## T12b — done

AUTH-16/ADR-014/[plano](../plan/T12b-REMEMBERED-SESSION.md), integrador único. Nova prioridade do titular: manter login/entrada rápida no Expo Go, sem salvar senha. Token rotativo no SecureStore, online/owner/active session e logout completo. Nenhuma implementação bancária real desbloqueada.

T12b checkpoint:686 testes/typechecks,22 novos casos, smoke refresh/rotação/logout fictício com cleanup, export Hermes iOS2.6MB e inspeção JS1166 fontes/54 pacotes aprovados; raízes altas ausentes do cliente,19 alertas toolchain inalterados. Instalação SecureStore sem scripts e conferência SDK offline aprovada (não verificação online de latest). Próximo commit/push/CI/publicação/QR; primeiro login na versão nova necessário, pois prévia antiga não guardava refresh token.

T12b publicada: commiteb9c865/CI39428239529 success/update01a15971-ed8f-7228-908b-945be1207249/grupoc5625e52-6247-4f47-8889-a8f4b0eb31a3. QR remoto atualizado; manifesto/hash conferidos. Titular orientado a entrar uma vez com Manter meu acesso; teste de retomada solicitado assíncrono, sem bloquear tarefas independentes. Não renovar OTP da conta já criada.

## T54a2 — done

SEC-23a/[plano](../plan/T54a2-NESTED-PACKAGES.md), integrador único. Corrigir versão de instâncias aninhadas no relatório, sem alteração do app nem do gate financeiro.

T54a2 evidência:7 testes focados passaram; inspeção real repetida no mesmo export privado1166 fontes/54 instâncias resolveu metro-runtime0.84.5 corretamente, sem raízes vulneráveis no grafo. Suíte completa anterior686; novo caso será incluído na CI. App/QR não mudaram; próxima T65a avaliação sem custos.

T12b aceite físico20/10: titular confirmou retomada sem pedir senha ao alternar apps no iPhone. Reabertura após término do processo/logout físico/30dias não foram inferidos. Continuar tasks independentes sem pedir novo aceite para cada uma.

## T65a — done como avaliação, sem homologação real

[Plano/matriz](../plan/T65a-EXPO-GO-ZERO-COST.md), integrador único. Orçamento zero/Expo Go preservados; senha/token protegido e primeira candidata financeira volátil/online, sem persistência em claro. FaceID adiado; suporte documental de ScreenCapture/Crypto não equivale a teste físico. T65/T63/T78 continuam incompletas. Próxima T51b2a destinos/cursor upstream em fixtures e T65b1 proteção de tela.

## T51b2a — done

SEC-24/ADR-015/[plano](../plan/T51b2a-UPSTREAM-TARGETS.md), integrador único. Refinar destino/IDs upstream necessários somente server-side e preservar cursor de /v2/transactions sem seguir URL da fonte. Nenhuma liberação de dados reais; autoria e logs permanecem gates separados.

T51b2a evidência:698 testes/typechecks passaram,11 novos casos/corpus de SSRF/escopo/cursor/encoding. Destino literal/conta e período vinculados; query opaca preservada e nextnull encerra. APItransações antiga obsoleta identificada na pesquisa; caminho preparado usa /v2/transactions com dateFrom/dateTo corretos, sem inventar pageSize não documentado. Sem transporte/rede/provedor real/deploy. Allowlist de funções agora9files, entrypoints ativos intocados. Próxima T65b1 proteção de tela e T51b2b transporte/normalização/owner/lease/cursor interno em fixtures.

## T65b1 — done

SEC-25/[plano](../plan/T65b1-SCREEN-PROTECTION.md), integrador único. Proteção nativa de captura/multitarefa antes de montar telas privadas, compatível com Expo Go e sem custo. Sucesso do SDK/mocks não aprova banco real; teste físico depois da publicação.

T65b1 checkpoint:710 testes/typechecks passaram,12 novos cenários. Sem APIs financeiras/serviços pagos; módulo nativo incluído no Go. Root monta Stack antes do guard, janela privada só mostra conteúdo ready+active, nativo cobre snapshot/multitarefa. Teste físico de captura ainda pendente; export/scan/CI/publicação em andamento.

T65b1 validação local concluída:710 testes/typechecks/export Hermes2.6MB/scan aprovados; inspeção privada1172 fontes/55 instâncias sem duas raízes vulneráveis no cliente. Audit permanece19 afetados toolchain/mesma exceção sintética, sem novos advisories. Compatibilidade pelo SDK instalado confirmada offline; app/teste nativo publicado seguem próximos.

T65b1 publicada: commite2bfeaa/CI39459277303 success/update01a15a30-9dfd-773a-ba38-2c283d4cd2bd/grupo2cfdc1b2-412b-4f30-b3c4-6d751a196f71. QR atualizado/manifesto e hash conferidos.710 testes/typechecks/export/scan; teste físico sintético de captura/multitarefa solicitado assíncrono. Não confundir publicação com homologação nativa; financeiro real segueoff. Próxima T51b2b1 preservar números monetários do JSON fornecedor sem arredondamento, ainda em fixtures.

## T51b2b1 — done

MPG-14/[plano](../plan/T51b2b1-EXACT-UPSTREAM-JSON.md), integrador único. Preservar números originais do JSON fornecedor antes de projeção/BigInt, com limites/capability failclosed, sem rede/deploy/cliente financeiro.

T51b2b1 evidência:723 testes/typechecks passaram,13 novos casos. Decimal/integer além do safeint e exponentes preservados pelo source original; contador exige origem/limites; body128KiB/profundidade64/literal128; abort durante decoder impede retorno. Runtime sem contextsource falha na factory; Node22 comprovado, Deno ainda não homologado. Default JSON de Auth/status preservado. Sem cliente/deploy/rede financeira; allowlist agora10files. Próxima T51b2b2 projeção mínima de contas com decimal exato/PII descartada e composição/transporte sob owner/lease.

## T51b2b2 — done

MPG-15/[plano](../plan/T51b2b2-ACCOUNT-PROJECTION.md), integrador único. Projeção mínima exata fornecedor→DTO de contas em fixtures; dados de identidade descartados e relações/datas não inferidas. Transporte/owner/consentimentos/lease seguem pendentes.

T51b2b2 evidência:735 testes/typechecks aprovados,12 novos cenários. BigInt do literal original preserva centavos até safeinteger; fração de centavo/overflow/paginação incompleta/conta externa ou duplicada falham. BANK mínimo sem PII, CREDIT excluído e cobertura parcial; datas/relações desconhecidas não são inventadas. Integração decoder→projeção→normalizer→MemoryAssets validada; lote inválido preserva snapshot anterior. Allowlist11files; sem rede/deploy/cliente novo. Próxima T51b2c composição de transporte fixture com autenticação privada, owner/sessão/lease e cancelamento; definir spec/plano antes do código.

T65b1 aceite físico recebido20/10/2026: titular confirmou captura e multitarefa protegidas no iPhone da matriz informada; nenhum screenshot privado recebido. Gravação/encerramento/outras versões não inferidos. T51b2b2 CI39461793986 success/commit70d1efa.

## T51b2c1 — done

MPG-16/[plano](../plan/T51b2c1-ACCOUNT-TRANSPORT.md), integrador único. Porta de contas com chave privada e transporte literal, dados fictícios; composição owner/sessão/lease a seguir. Titular pediu priorizar fechamento do acesso às contas e executar todas as tarefas sem pendências pessoais antes de teste conjunto.

T51b2c1 evidência:747 testes/typechecks/12 novos casos aprovados. Auth antiga mantém authenticate/close; factory de contas mantém chave privada, destino literal e contexto capturado, deadline total20s/abort/close/busy/401purge/429semretry. Decoder+projeção antes de devolver DTO mínimo; sem rede real/deploy/cliente. Próxima T51b2c2 coordenador owner/sessão/lease e composição fixture.

## T51b2c2 — done

MPG-17/[plano](../plan/T51b2c2-AUTHORIZED-ACCOUNTS.md), integrador único. Handler fixture autenticado com owner/vínculo/revisão/lease antes/depois da leitura e revalidação de sessão. Resolver privilegiado e composição de entrypoint seguem separados.

T51b2c2 evidência:759 testes/typechecks/12 casos aprovados; Auth→resolver owner/conexão/revisão→lease→provedor→Auth novamente→lease, DTO mínimo/no-store. Nonowner/IDOR/sessão revogada/lease perdido/abort/deadline descartam resposta. Allowlist12files, entrypoints inativos intactos. Transporte T51b2c1 CI39464639948 success. Próxima T51b2c3 resolver privado service-only de vínculo sob lease, ainda sem conexão real.

## T51b2c3 — done

MPG-18/[plano](../plan/T51b2c3-PRIVATE-BINDINGS.md), integrador único. Resolver RPC privado sob lease e porta REST em fixtures, nova migration/SQL rollback. Sem vínculo ou conexão bancária real.

T51b2c3 evidência:768 testes/typechecks aprovados (7 REST+2 runner novos), migration8 aplicada/hash verificado no projeto próprio, SQL positivo/IDOR/revisão/nonce/lease expirado/binding ausente/permissões/pausa com identidades fictícias e rollback. Zero identidades restantes/owner preservado. RPCservice-only retorna apenas bindings e evidência conservadora; sem coleta/segredoPluggy/deploy. Handler transmite leaseId ao resolver, allowlist13files. T51b2c2 CI39465045891 success. Próxima T51b2c4 endpoints autenticados acquire/finalize e composição do lote; financeiro real continuaoff.

## T51b2c4 — done

MPG-19/[plano](../plan/T51b2c4-READ-LIFECYCLE.md), integrador único. Contrato HTTP acquire/read/finalize autenticado, integração fixture e nenhum entrypoint ativo.

T51b2c4 evidência:778 testes/typechecks/10 novos casos. Ciclo HTTP fixture acquire/read/finalize integrado, Auth antes/depois/RPCscopeownerderivado, confirmaçãofinalize, busy/cooldown explícitos, body/IDOR/abort/timeout/erro genérico. Lease perdido após cancelamento expira pelo TTL, sem falsa promessa de cleanup. Allowlist15files; sem deploy/financeiroreal. Próxima T51b2c5 gateway client restrito e integração do lote/cache em memória; contextos de IDs internos precisam de registry autenticado separado.

## T51b2c5 — done

MPG-20/[plano](../plan/T51b2c5-CLIENT-ACCOUNT-GATEWAY.md), integrador único. Gateway client restrito do lote de contas e prova HTTP→cachevolátil, sem ativar integração real. Registry/readiness compõem a seguir.

T51b2c5 evidência:786 testes/typechecks/8 novos casos. Integração HTTPfixture provider→router→gateway→SyncSession publica29centavos exatos e purga ao lock; falha de finalize preserva snapshot29. IDs/receipt/origem/401lock/429/no-retry/redirect/abort/deadline validados. Nenhum segredo/provedor no cliente; gateway não importado pelo runtime/sem publicação. C4 CI39465784180 e C3 CI39465452627 success. Próxima T51b2c6 registry autenticado de IDs internos para contexto, depois composição readiness/cache e checklist de ativação.

## T51b2c6 — done

MPG-21/[plano](../plan/T51b2c6-ACCOUNT-REGISTRY.md), integrador único. Registry interno por RLS e transporte compartilhado com operações fixas; sem valores financeiros ou IDs externos.

T51b2c6 evidência:793 testes/typechecks/7 casos novos, gateway29c/regressões preservados. Registry GETliteral sóid/connection_id sob RLSsessãoowner, limite1000/duplicata/UUID/erro/401/429/abort/timeout, sem IDs externos/valores/ownerURL. shared session-json fecha destinos e mantém origem/cancelamento. Sem runtimeimport/publicação. Próxima T51b2c7a seleção explícita de produtos em lote para ler somente contas sem adulterar capabilities, depois c7b controlador readiness/cache e integração UIoff.

## T51b2c7a — done

MPG-22/[plano](../plan/T51b2c7a-PRODUCT-SCOPE.md), integrador único. Seleção explícita para iniciar acesso por contas sem falsificar capacidades dos demais produtos.

T51b2c7a evidência:799 testes/typechecks/6 casos novos. Seleção accounts-only percorre3camadas sem contextos extras/capabilities falsas e mantém ledger não solicitado; inválidos não adquirem lease, mutação após await não amplia produtos. Default continua todos legíveis e resumo parcial explicita omissão. Próxima c7b controlador readiness/cache.

## T51b2c7b — done

MPG-23/[plano](../plan/T51b2c7b-PRIVATE-ACCOUNT-CONTROLLER.md), integrador único. Controlador de contas condicionado à proteção de tela e sessão, status/registry/gateway/cachevolátil.

T51b2c7b evidência:807 testes/typechecks/8 casos novos. Controller exige sessão+Screenreadyactive antes de UUID/cache/status/registry/coleta; queryguarded, subscrições fecham/purgam ao lock/inactive/fail, closepermanente, busy e deadline120s/cancel mesmo com statusnão cooperativo. ScopeUUIDlocal, snapshots semfinanças, capabilities preservadas/accountsselecionado. Sem import no runtime/deploy. Próxima c8 composição UI sob flags independentes e UUIDnativoCrypto57.0.4 compatível Go, export/scan/audit/publicação somente após checks.

## T51b2c8 — done

MPG-24/[plano](../plan/T51b2c8-ACCOUNT-APP.md), integrador único. Tela/composição contas sob3gatesindependentesfalse e UUIDlocal nativo Crypto incluídoGo; nenhum banco real habilitado.

T51b2c8 evidência:810 testes/typechecks/exportHermes2.7MB/scan aprovados; auditoria mantém19afetados/mesmaexceção, JS1201fontes/56instâncias semduasraízes e mapasprivados. Tela Minhas contas/valoresocultos/Cardsexistentes, composição3gatesfalse e UUIDCrypto57.0.4 incluídoGo; gatezero/ready tested. Sem banco real/deploybackend. Publicação remota após CI, sem pedir teste intermediário. Próxima c9 consentimento upstream atual antes de saldo, pois proxy expirado pode devolver lista vazia com statusantigo.

## T51b2c9 — done

MPG-25/[plano](../plan/T51b2c9-CURRENT-PROXY-CONSENT.md), integrador único. Conferir consentExpiresAt atual do proxy antes de contas; nunca apagar por vazio após autorização expirada.

T51b2c9 evidência:817 testes/typechecks/7 novos casos. Auth→GETitem→GETaccounts com consentExpiresAt futuro antes e depois, status/erro/warnings/ação/proxyprodutos verificados; expirado/null/unknown impede contas mesmoUPDATEDantigo. ItemPII descartada/sourceAtual não vira data de saldo. Prazo20s total mantido, allowlist16files, sem rede/deployreal. Tela c8 CI39467658558 success. Próxima c10 composição backendfixture com todas as portas, preparar ativação privada/documentar pendências e publicar prévia c8 após CI/scan.

## T51b2c10 — done

MPG-26/[plano](../plan/T51b2c10-BACKEND-COMPOSITION.md), integrador único. Boot backendfixture fecha todas as portas e rotas sob ownproject/flags, sem mudar entrypointfinanceirooff.

T51b2c10 evidência:823 testes/typechecks/6 casos novos. Bootfixture toda cadeiaAuthowner/lease/RPCbinding/itemconsent/accounts29c/finalize, ownproject literal/3flags/offsemsecrets, prefixorotas fechado, cap4/closeabort/noPII. Allowlist17files, entrypointpublicadov1off intacto. Próxima c11 probe decimalexato no Edge real sem banco/segredo de fornecedor, cleanup; guia/publishclientfinal.

## T51b2c11 — done

MPG-27/[plano](../plan/T51b2c11-EDGE-EXACT-PROBE.md), integrador único. Função temporária numérica sem finanças no projeto próprio, smoke/cleanup/recibo privado, sem alterar funções existentes.

T51b2c11 evidência:827 testes/typechecks (4guardas novos), Edgegerenciado exactJSONsupportedtrue com9007199254740993/0.29, funçãotemporária removida e zerochamadasprovedor. Smoke metadata5negativos e ponte3off aprovados. Drift administrativo detectado: ponte v3/recibov1; downloadreadonly index/core coincidem com hashesmanifesthistórico/coregit1f2b6a6832a1. Recibo local reconciliado após ID/version/hash, zero mudanças remotas. Ponte atualv3literalfalse, metadatav3ACTIVE. Próxima releasefinalc8 apósCI/scan (bundlejáexportado/runtimeauditpronto), QR/docs/checkpoint; gatesreais e atuação conjuntanoACCOUNT-ACTIVATION.

## T51b2c12 — done

MPG-24/AUTH-16/SEC-25/[plano](../plan/T51b2c12-ACCOUNT-PREVIEW-RELEASE.md), integrador único. Publicar prévia remota da tela contasoff após CI, conferirmanifest/hash/QR e checkpoint final sem pedir teste agora.

T51b2c12 publicada:827 testes/typechecks/SDK/export/audit/runtimeaudit/scan, CI39469588156 success. Update01a15a72-7573-7ea8-a2e6-e45df58e640a/grupo260de9bf-5ad0-460d-870a-d2a69a356e47/commit239c7c1, iospreview/exposdk57.0.0; manifesto schemeorbe/hashHBC/linkQRoficial conferidos, PNG atualizado. Nenhum token/mapa financeiro publicado; banco real segueoff.Links locais:146 verificados semquebra antes da publicação. Titular testa restante depois, sem nova pergunta. Pendências/gates e roteiro conjunto emACCOUNT-ACTIVATION; não chamar produto bancário de concluído.

## T51b2c13 — done

MPG-28/[plano](../plan/T51b2c13-PRIVATE-PROVIDER-PROFILE.md), integrador único. Preparar perfil privado vazio e preflight redigido semrede, não pedir credenciais agora. Titular recebeu status:5blocos antes de saldosreais, produtos restantes posteriores.

T51b2c13 evidência:834 testes/typechecks (7guardas novos), perfil privado pluggy.env vazio/0600/dir0700 criado; initneveroverwrite/checkredacted/symlink/hardlink/owner/mode/strictkeys/8KiB testados, providercalls0. Guia atualizado, nenhuma credencial solicitada nem flag/rede/backend alterados. Publicação c12 update01a15a72-7573-7ea8-a2e6-e45df58e640a preservada; CI39470127974 da documentação de release success. Faltam5blocos para saldosreais conformeACCOUNT-ACTIVATION: segurança, autorizações/credenciais, bindings, deployreal, aceiteiPhone; não confundir com produtosbancários posteriores.

## T51b2c14 — done

MPG-29/[plano](../plan/T51b2c14-USER-SETUP-AND-SECURITY-STATUS.md), integrador único. Revalidou audit19altos/0críticos/2raízes com advisories oficiais sem patch; downgrade major proposto incompatível não aplicado. Fontes oficiais personalguide/dashboard/legal/segurança revistas, bloqueios externos concretos e perguntas preparadas sem contato. Guia permite cadastro vazio/ClientIDSecret no perfil privado agora e separa autorização bancária posterior. Preflight perfilready/credentialsfalse/providerCalls0. Sem código/flags/deploy/mudança bancária; testes834/CI39470696598 da implementação anterior aprovados, sem repetir suíte por docs.

Checkpoint de configuração20/10: titular informou2campos salvos. provider-profilecheck credentials_configuredtrue/formato/permissões, provider_calls0; nenhumvalorimpresso/consulta bancária/AuthPluggy. APIkey não é terceiro campo exigido. Roteirooficial bancário/proxy reconferido, Orbe financeirooff/gatespendentes.

## T51b2c15 — done

MPG-30/[plano](../plan/T51b2c15-PRIVATE-ITEM-INVENTORY.md). Inventário offline privado por banco, sem rede/provisionamento SQL. Relato do titular confirma importação; não tratar como evidência de OF ou homologação real.

T51b2c15 evidência:843 testes/typechecks aprovados (764Node+79Python), incluindo9casos de inventário e7regressões do perfil. Template privado criado0600 semIDs; init/check provider_calls0. Inventário não provisiona SQL/ativa produto; identificadores precisam ser copiados privadamente do Dashboard porque plano pessoal não permite listagem global. Próxima c16 staging server-only pendente, sem afirmar OF/consentimento/capacidades.

## T51b2c16 — done

MPG-31/[plano](../plan/T51b2c16-PENDING-CONNECTION-STAGING.md). RPC service-only para cadastrar apenas metadados pending e item privado, sem ativar/consultar banco. SQL isolado com identidades inventadas, nenhuma conta real.

T51b2c16 evidência: migration9 aplicada/hash verificado no projeto próprio; test-account-bindings com staging privilégio/owner/instituição/nil/item duplicado/repetição/substituição/não reativação/evidências desconhecidas/sem contas passou com rollback, zero identidades restantes e proprietário preservado.34regressões administrativas e scan privado aprovados; suíte843/typechecks da c15. Nenhum item real provisionado, flag/deploy financeiro inalterado. Próxima c17 aplicador privado; IDs aguardando cópia privada pelo titular, sem solicitação pelo chat.

## T51b2c17 — done

MPG-32/[plano](../plan/T51b2c17-OBSERVED-ITEM-INVENTORY.md). Corrige exigência de dois IDs; versão2 aceita1a5itens/unknown sem inferir cobertura.13testes do inventário/847testes+typechecks aprovados, template legado vazio migrado sem sobrescrever IDs. Titular forneceu URL do item mostrado com produtos MP: identificador salvo só no arquivo privado, preflight1item/1identificado/0chamadasprovedor. Screenshotposterior confirma dois bancos na origem, não comprova dois itens na aplicação. RPC antiga pending não foi executada nem alterada; próxima c18 aplicador privado de staging para item conhecido, sem coleta financeira.

## T51b2c18 — done

MPG-33/[plano](../plan/T51b2c18-PRIVATE-STAGING-APPLIER.md). Aplicador privado de metadados pending; nenhuma consulta financeira/provedor. ItemMP foi fornecido pelo titular; Bradesco noDashboard não comprovado.

T51b2c18 evidência:855testes/typechecks (764Node+91Python),8novoscasos, checkoffline aprovado. Supabase exige revealtrue para segredo completo; permitido somente GETliteral na administração, chave apenas em memória/nuncastdout. Staging executado do único item fornecido, retorno1pending/providerCalls0/financialReads0; consulta agregada booleana confirmou exatamente1MPpending sem capacidades/OF, nenhum dado financeiro. Falha inicial de chave mascarada diagnosticada sem revelar valores, corrigida. Nenhum itemBradesco inventado/nenhum deploy ou flag alterado.

## T51b2c19 — done

MPG-34/[plano](../plan/T51b2c19-RESTRICTED-NETWORK.md). Rede server-only fechada por destino/credencial e gates, sem import por entrypoint ou chamadas reais.

T51b2c19 evidência:863testes/typechecks (772Node+91Python),8casos novos. Destinos/métodos/credenciais fechados, offzero/headerscruzados/queryhost/body/preabort/redirect/erro genérico/integraçãoAuth preparados com rede injetada; sem chamada real, sem entrypointimport, sem mudanças nos gates/deploy/QR. CI39509599362 do aplicador c18 success. Próxima fatia técnica: inventário de contas projetado server-side para provisionar IDs internos sem coletar valores nas ferramentas; definir spec/plan antes do código, composição real ainda sujeita às revisões/gates existentes.

## T51b2c20 — done

MPG-35/[plano](../plan/T51b2c20-MINIMAL-ACCOUNT-INVENTORY.md). Projeção privada de IDs/moeda, nenhum acesso a saldo/PII, rede, SQL ou ativação. Mantém IDs técnicosCREDIT porque a projeção financeira existente exige binding antes de excluir seus valores.

T51b2c20 evidência:871testes/typechecks (780Node+91Python),8casosnovos. Projeção de IDs/moeda validada com decoderexato, paginação/contagem/UUID/item/duplicata/tipomoeda/limites, camposprivados com getters que falham não foram acessados; saída congelada e sem valores. CREDIT sóIDtécnico/moedanull/kindunknown, não saldo/limite. Nenhuma redeSQL/entrypoint/flag; próximo c21 RPCatômica de bindings mínimos com owner/pending/revisão e sem reativação.

## T51b2c21 — done

MPG-36/[plano](../plan/T51b2c21-ATOMIC-ACCOUNT-BINDINGS.md). Registro atômico server-only de metadados de contas em pending, sem dados reais ou ativação. Migration nova e testes SQL com identidades fictícias/rollback.

T51b2c21 evidência: migration10 aplicada/hashverificado no projeto próprio; SQL rollback com privilégios/owner/revisão/item/duplicatas/PIIextra/atomicidade/repetição/UUIDinterno/moeda/vaziosemdeleção/paused aprovado, zeroidentidades restantes e ownerpreservado. Nenhuma conta real registrada;871testes/typechecks vigentes da c20. Próxima c22 resolver privado de pending para descoberta, sem entregar IDs externos ao cliente.

## T51b2c22 — done

MPG-37/[plano](../plan/T51b2c22-PENDING-INVENTORY-PORTS.md). Resolver SQLpendingservice-only e portasRESTprepared, rede restrita às2RPCs adicionais; sem dados reais ou entrypointfinanceiro.

T51b2c22 evidência:879testes/typechecks aprovados (788Node+91Python),8casosnovos. Migration11 aplicada/hashverificado; SQL resolver privilégios/pending/owner/revisão/contexto mínimo passou comrollback/zeroresíduos/ownerpreservado. PortasREST offzero/cancelamento não cooperativo/escopos/body mínimo/rede restrita validados; nenhumrequestfinanceiro/entrypoint alterado. Próxima c23 reutilizarpipelineAuth→consentimentoitem→contas para inventário mínimo, com coordenadordedescoberta e revalidaçãoSQL antes de commit.

## T51b2c23 — done

MPG-38/[plano](../plan/T51b2c23-PROVIDER-INVENTORY.md). Pipelineinterno compartilhado para inventário mínimo com consentimento, API financeira existente preservada; zero rede real.

T51b2c23 evidência:887testes/typechecks (796Node+91Python),8casosnovos. PipelineúnicoAuth→itemconsent→accounts preserva DTO financeiro existente e projeta inventáriomínimo; offzero/contextoinválido/consentexpirado/durantecoleta/close/abort/chavecacheprivada aprovados com rede fictícia. Nenhum tokenfornecedor exposto ou entrada ativa alterada. Próxima c24 coordenador com Auth/owner/resolverrecheck/store e resultado somentecontagem.

## T51b2c24 — done

MPG-39/[plano](../plan/T51b2c24-AUTHORIZED-INVENTORY.md). Coordenador preparado de descoberta/revalidação/registro, retorno somentecontagem e limites explícitos de cancelamento após commit; sem HTTP/entrypointativo.

T51b2c24 evidência:897testes/typechecks (806Node+91Python),10casosnovos. Cadeia Authowner→resolver→inventário→Authsameowner→resolvermesmoitem→store responde somentecontagem; nonowner/IDOR/mudança/expiração/malformação/abort/close/busy/falsecommit testados. SintaxeNode22 corrigida antes da aprovação final. Nenhum endpointpublico ou coleta real. Próxima c25 bloqueio/cooldownSQL compartilhado para descoberta antes de criar rota pública.

## T51b2c25 — done

MPG-40/[plano](../plan/T51b2c25-GLOBAL-DISCOVERY-LEASE.md). Lease/cooldown global reusado da conexão e commit de metadados atômico; nenhuma coleta real.

T51b2c25 evidência: migration12 aplicada/hashverificada; SQL sintético privilégios/owner/revisão/acquire/busy/check/nonce/commit/replay/cooldown/novoNonce/expiração e não alteração de evidênciafinanceira passou comrollback/zeroresíduos/ownerpreservado.897testes/typechecks vigentes c24; nenhuma coleta real. Próxima c26 portaslease/commit e coordenador com leaseobrigatório.

## T51b2c26 — done

MPG-41/[plano](../plan/T51b2c26-LEASED-DISCOVERY.md). Leaseobrigatório no coordenador e3RPCs adicionais, parsergrantcompartilhado, nenhum HTTP ou fornecedorreal.

T51b2c26 evidência:901testes/typechecks (810Node+91Python),4novoscasos e cenários anteriores ajustados ao leaseobrigatório. Parserdegrantreusado, acquire/check/commitREST/noncebody e rede fechada validados; busy/cooldown/perdalease bloqueiamprov/commit. Nenhumregistro/coletareal ouentrypointalterado. Próxima c27 handler HTTP preparado para descoberta com bodybounded/token/statussemIDs e controleinflight; depoiscomposiçãobackendfixture e revisão de bootreal.

## T51b2c27 — done

MPG-42/[plano](../plan/T51b2c27-DISCOVERY-HANDLER.md). Handlerprepared com entrada interna/statuswhitelist/timeout/cancel/1inflight, nenhum entrypoint publicado.

T51b2c27 evidência:909testes/typechecks (818Node+91Python),8casosnovos. Handlerfixtures valida entrada/token/método/query/oversize/statuswhitelist/contagem/PIInão refletida/close/abort/busy/off. Não foi importado/publicado no entrypoint e não houve chamada real. Próxima c28 composiçãoprepared e configuraçãoúnica para contas/descoberta.

## T51b2c28 — done

MPG-43/[plano](../plan/T51b2c28-INVENTORY-RUNTIME.md). Configuraçãoúnica e composição HTTPAuth→lease→inventário→commit com rede restrita e fixtures, sem entrypointfinanceiro.

T51b2c28 evidência:914testes/typechecks (823Node+91Python),5casosnovos. Configuração centralizada preserva gatesoff/host/chaves/decoderprobe antes de privados; composiçãoHTTP inteira via fronteiraderede/Auth/revalidações/lease/consentimento/inventáriomínimo/commit com fixtures aprovada. Nonowner/path/configmalformada/close/preparedfalse falham semprovedor. CI39511853244(c26)success. Nenhum entrypoint/QR/flag/financeiroreal alterado. Próxima c29 contrato de execução fixture/live para preparar bootreal sem disfarçar produção comofixture, mantendo aprovação e gates fechados.

## T51b2c29 — done

MPG-44/ADR-016/[plano](../plan/T51b2c29-EXECUTION-MODES.md). Modos explícitos e propagação lowlevel; bootalto/entrypoint/flags reais inalterados.

T51b2c29 evidência:921testes/typechecks (830Node+91Python),7casosnovos. Defaultoff/liveapproval/conflitofixture/live/projeção/auth/handler/capturamodo emclosure aprovados. Factoriesfixtureantigas preservadas, modo validado propagado às projeções sem usarfixturetrue para dadoslive. Bootalto continuafixtureOnly/entrypointoff, nenhuma rede real. Próxima c30 bootexplícitolive sob código+flags+redeguardada, aprovação externa permanecependente.

## T51b2c30 — done

MPG-45/ADR-016/[plano](../plan/T51b2c30-GUARDED-LIVE-BOOT.md). Composições altas com modo explícito/trava liveApproved/flags/redeguardada; nenhuma publicação/env/segredo alterados.

T51b2c30 evidência:926testes/typechecks (835Node+91Python),5casosnovos. Codegate independente/conflito/defaultoff, bootlivecontas29centavos e bootlivedescobertacontagem completos com rede injetada; propagação mode/live semfixture e fronteiraredepreservadas. Flags/entrypoint/remotesecrets intactos, nenhuma chamada real. Próxima c31 unificarentrypoint sob travafalse e atualizarallowlist/scans/deploydesligado revisado.

## T51b2c31 — done

MPG-46/[plano](../plan/T51b2c31-DISABLED-BACKEND-RELEASE.md). Rootunificado codeoff antesenv; empacotamento explícito/canários privados/7smokes503, sem liberação de dadosreais.

T51b2c31 evidência:934testes/typechecks (839Node+95Python),4root+4canário novos. Allowlist26arquivos/canáriosPATownerExpoPluggyitemIDs/entryexatoliveApprovedfalse testados. Deploy próprio orbe-bridgev4ACTIVE,7HTTP503/no-store e providerCalls0/financialReads0, recibo/logprivados foraMetro. Metadata/client/QR nãoalterados. Próxima c32 gatewayclientdedescoberta sobgates, depoisreadiness/UI e revisão antes deativar.

## T51b2c32 — done

MPG-47/[plano](../plan/T51b2c32-CLIENT-DISCOVERY-GATEWAY.md). Gateway cliente de descoberta com operação fechada/gates/statuscontagem; backendpublicadooff e nenhum request real.

T51b2c32 evidência:943testes/typechecks (848Node+95Python),9casosnovos, exportiOS aprovado. Gateoff/corpoIDinterno/hostpróprio/401403lock/429semretry/abort/malformação/bounds4096/prazo120sapenasdiscover validados; resposta somentecontagem. Nenhum QR/flag/coleta alterado. Próxima c33 controladorreadiness/proteção e adaptação da telaConexões sobflagfalse.

## T51b2c33 — done

MPG-48/[plano](../plan/T51b2c33-READY-DISCOVERY-UI.md). Controlador/runtimeprontidão e botãohiddenporflagfalse emConexões, sem redesreais/novo layout/cores.

T51b2c33 evidência:954testes/typechecks (859Node+95Python),11novoscasos. Gateoff/readiness/proteção/sessão/pending/revisão/abort/busy/cooldown/empty/semredeinicial validados. ExportiOS e runtimeaudit1204fontes/56instâncias aprovados, raízesadvisoriesausentesJS/mapasprivados. inventoryDiscoveryEnabledfalse; UIadaptativa semlayoutnovo/novasconsultas enquantooff. Próxima c34 validar apenas POSTauth técnico do perfilprivado (nenhum GETitem/conta), depoispublicação consolidada conformeCI/scan.

## T51b2c34 — done

MPG-49/[plano](../plan/T51b2c34-TECHNICAL-AUTH-CHECK.md). Autenticação administrativa explícita somenteAuth, sem GETdeitens/contas/valores e semAPIkeypersistida.

T51b2c34 evidência:958testes/typechecks (859Node+99Python),4novoscasos de Auth. Perfil0600/rotaliteral/bodyTLS/NOproxy/NOredirect/20s/4096/redação testados; somente POSTauth real respondeu credenciaisautenticadas,providerCalls1/financialReads0. APIkey não salva/exibida/usadaemGET. Não comprova item/cobertura/OForiginal nem libera flags. Próxima c35 publicarprévia consolidada apósCI958/scan/runtimeaudit, sem testeintermediário.

## T51b2c35 — done

[Plano](../plan/T51b2c35-DISCOVERY-PREVIEW-RELEASE.md).958testes/typechecks/exportiOS/runtimeaudit1204/56 aprovados; publicar somente apósCI/scan. Flags cliente/backend off, sem testeintermediário.

T51b2c35 publicada:958testes/typechecks/export/runtimeaudit1204/56/scan todosperfis e CI39514871905 success. Update01a15ba3-efdc-7ce4-b328-fa16a89c0e12/grupo41095d0a-c262-4850-a4ab-122bdce6caf0/commitbe80325, iospreviewSDK57; manifesto scheme/hashHBC/linkQR conferidos, PNG atualizado. Nenhumflagfinanceiro ou teste solicitado. Próxima c36 configurar segredos backend exclusivamente desativados, preservando metadata/Auth e sem dados bancários.

## T51b2c36 — done

MPG-50/[plano](../plan/T51b2c36-DISABLED-BACKEND-CONFIG.md). Segredos backend somentecomflagsfalse, preservação demetadata/Auth/digests/artefatoseversões; nenhuma coleta financeira.

T51b2c36 evidência:967testes/typechecks (859Node+108Python),9casosnovos.7segredos backend configurados exclusivamentecom4flagsfalse; digests confirmados/metadatasemalteração. Supabase atualizoubridge4→5/metadata3→4 e archivehashes; downloadreadonly confirmou23fontesbridge/5metadata iguais aosrecibos, entrypoints presentes; recibosprivados sóversãoreconciliada. Reexecuçãoidempotenteadded0/configreadytrue.7smokes503/no-store e5negativosmetadata aprovados;ownerpositivo não testado/remotefinancialReads0. Nenhuma chamadaPluggy nova (total1Auth/0financeiros), sem teste do titular. Próxima c37 revisão nativa de fetch/cache/cookies e evidências de privacidade antes deativação, sem prometer garantia absoluta.

## T51b2c37 — done

SEC-26/[plano](../plan/T51b2c37-NATIVE-HTTP-REVIEW.md). RevisãoSwift/JS e cabeçalhosHTTPcentralizados; não inferir cachezero/SDKbinárioigual/telemetriaausente.

T51b2c37 evidência:967 testes/typechecks aprovados; exportação iOS e auditoria runtime1205 fontes/56 instâncias aprovadas, mapas privados e raízes vulneráveis ausentes do grafo cliente. Quatro testes de transporte ampliados verificam no-store/no-cache/Pragma; metadados aguardam proteção pronta/ativa. Revisão de8fontes JS/Swift documentada com hashes e limites. Nenhuma leitura financeira ou flag alterada. Próxima c38 publicar esta correção após scan/CI e atualizar QR/checkpoint.

## T51b2c38 — done

SEC-26/[plano](../plan/T51b2c38-HTTP-PREVIEW-RELEASE.md). Publicar correção iOS após CI, verificar bundle/manifesto/QR e atualizar checkpoint, sem alterar gates.

T51b2c38 evidência: CI39518018154 success;967testes/typechecks/exportiOS/runtimeaudit1205/56/scan privado aprovados. Publicado update01a15bbf-7194-7ce1-8903-b8ca5ff4e0e3/grupo1dbf421d-740d-47d5-aff6-8858a3b7732e/commitad2dcc3; manifesto schemeorbe/hashHBC/linkQRoficial conferidos, PNG atualizado. Nenhuma leitura financeira ou flag alterada; sem teste intermediário. Próxima c39 consolidar documentação operacional atual, preservando evidências históricas nas tasks.

## T51b2c39 — done

MPG-04/05/06/07 e SEC-26/[plano](../plan/T51b2c39-OPERATIONAL-STATE.md). Consolidar estado operacional e retirar instruções já cumpridas; nenhuma mudança de gates.

T51b2c39 evidência: guias de ativação/prontidão consolidados com12migrations/bridge5/metadata4/967testes/previewc38; duplicação histórica identificada sem apagar trilha das tasks. Links locais dos8documentos e diffcheck aprovados; nenhuma mudança de código/export/gates. Próxima c40 revisar evidências públicas restantes do fornecedor para reduzir lacunas de privacidade sem contato, login ou dados financeiros.

## T51b2c40 — done

MPG-01/06/07 e SEC-24/26/[plano](../plan/T51b2c40-PUBLIC-PRIVACY-EVIDENCE.md). Revisão pública de privacidade específica do plano pessoal; nenhuma conta ou contato externo.

T51b2c40 evidência: matriz com9fontes/assuntos primários conferida, incluindo PDF público de6páginas; separação MCPauth/docs e exclusão deitem versus backups registradas sem inferir retenção/ausência deIA. Nenhum contato/login/GETfinanceiro. Gates inalterados. Próxima c41 automatizar scan de todos os perfis privados no publicador EAS antes do subprocesso autenticado.

## T51b2c41 — done

SEC-22a/[plano](../plan/T51b2c41-PUBLISHER-PRIVATE-SCAN.md). Automatizar preflight offline completo e falha fechada antes da CLI autenticada.

T51b2c41 evidência:977testes/typechecks (859Node+118Python),10novoscasos. Wrapperreal isolado rejeita export com segredoPluggy antes da CLI e aceita artefato limpo com CLI fictícia offline; canários em binário/divisão debloco/symlink/hardlink/FIFO/perfilinválido cobertos. Preflight real doexport25artefatos passou comnetwork0; scan fonte/exportde todosperfis e sintaxeJS/diffcheck aprovados. Nenhuma alteração cliente/backend/publicação/flags. Próxima c42 revisar alcance das duas dependências altas no tooling com fontes locais/advisories, sem downgrade nem inferir liberação por ausência no JS.

## T51b2c42 — done

SEC-23/MPG-06/T54/[plano](../plan/T51b2c42-TOOLCHAIN-REACHABILITY.md). Conferir advisories/callsites instalados e limites da mitigação sem executar material externo.

T51b2c42 evidência21/10: advisories oficiais ainda sempatch e seis fontes instaladas comhashes documentadas; watcherexamined some versusparse/braces e verificaçãoRSA em bibliotecaExpo identificados. Sem prova global de inatingibilidade, sem downgrades/suppressão/extensãoexceção. CI39518966284(c41)success/977testes preservados; mudança sódocumental. Próxima T22c1 contrato/identidade opaca para adaptermovimentos, independente de ativação financeira.

## T22c1 — done

EXP-13/ADR-017/[plano](../plan/T22c1-MOVEMENT-IDENTITY.md). Identidade interna estável para movimentos, backend isolado/sem rede ou liberação.

T22c1 evidência21/10:988testes/typechecks (870Node+118Python),11novoscasos. VetorHMAC independente Python/WebCrypto, UUIDv8 estável/separaçãoownercontachave, escopocapturado, importaçãoúnica/nãoexportável, erroredigido e closeassíncrono passaram. Validação UUIDestrita inclui tamanho36/inheritedscope rejeitado. Allowlist27fontes/scanperfis/export/diff aprovados; módulo não importado no entrypoint e nenhuma chave/env/rota/deploy criado. Próxima T22c2: janela mensal Brasília sem perder fim de mês em UTC, antes da projeção de payload.

## T22c2 — done

EXP-14/[plano](../plan/T22c2-TRANSACTION-MONTH-WINDOWS.md). Evitar truncamento de fim do mês de Brasília em consultas por diasUTC.

T22c2 evidência21/10:996testes/typechecks (878Node+118Python),8novoscasos.1200meses2000–2099 validados com builder real/31dias inclusivos/semgapouoverlap; UTC/Brasília/fimdemês/ano/fevereirobissexto/DST2018/ISOinválido/gatesoff cobertos. Allowlist28fontes/scantodosperfis/diff aprovados, nenhum rede/secret/deploy/exportcliente. Próxima T22c3 projeção mínima de movimentos reais emfixtures, sem inferir tipo financeiro/direção por sinal ou cobertura pelo cursorfinal.

## T22c3 — done

EXP-15/[plano](../plan/T22c3-PLUGGY-MOVEMENT-PROJECTION.md). Projeção bancária mínima/exata com IDs internos e sem extras ou rawcursor no DTO.

T22c3 evidência21/10:1008testes/typechecks (890Node+118Python),12novoscasos. ProjeçãoBANK/centavosexatos/null/direção/status/IDOR/cursorrawrestrito/PIIgettersexcluídos/viradaBrasília/dedupeconflito/NFCUnicode/snapshot/abort e integraçãoMemoryLedger comoverridepersistente aprovados. Allowlist29fontes/scanprivado/diff aprovados; nenhumsecret/rota/deploy/rede. Próxima T22c4 limite de decoder específico de transações: páginas500comextras podem ultrapassar128KiB; manter defaultcontas e limiteglobal finito antes do transporte.

## T22c4 — done

EXP-16/[plano](../plan/T22c4-TRANSACTION-JSON-BUDGET.md). Orçamento específico finito para páginas transacionais sem alterar defaults de contas/Auth.

T22c4 evidência21/10:1014testes/typechecks (896Node+118Python),6novoscasos. Perfiltransactions1MiBfixo preserva standard128KiB; leitorHTTPdedicado exige decoderexplícito.500movimentos comextras>128KiB passaramHTTP→decoderexato→projeção500IDs/14500centavos, extrasomitidos. Bounds1MiB/Unicode/depth/probe/perfilinválido/overflow/abort/MIME e defaultHTTP nãoampliável testados; allowlist29/scans/diff aprovados. Código compartilhado local diverge agora do remoto: próxima T22c5 publicar backend exclusivamenteoff apósCI e smokes, sem nova versãoExpo por não mudar cliente.

## T22c5 — done

MPG-06/46/EXP-16/[plano](../plan/T22c5-DISABLED-BRIDGE-RELEASE.md). Publicar somente bridge off apósCI; sem metadata/configuração/QR novos.

T22c5 evidência21/10: CI39587278861success/1014testes/typechecks; bridgev6ACTIVE publicado com liveApprovedfalse,29fontes verificadaslocalmente/canáriosprivados.7rotas503/no-store e5negativosmetadata passaram; metadata4 não redeployado, ownerpositivo não testado/financialReads0/providerCalls0. Nenhuma chave/flag/migration/cliente/QR alterado, recibo/logprivados. Próxima T22c6 cursorconfidencial/autenticado sob sessão/lease/manifesto/UTCwindow, sem habilitar rede.

## T22c6 — done

EXP-17/ADR-018/[plano](../plan/T22c6-PRIVATE-TRANSACTION-CURSOR.md). Cursor confidencial backend, sem rede/persistência/chave real ou ativação.

T22c6 evidência21/10:1027testes/typechecks (909Node+118Python),13novoscasos. AESGCMroundtrip/IValeatório/AADownerSessãoConexãoRevisãoLeaseExpiraçãoMêsItemManifesto, tamper/canonicidade/TTL/rollback/close/errocriptográfico/importnãoexportávelúnica e256bits testados. Token512/cursorgrande recusadoanteskey/snapshotmanifesto/transiçõesjanelaconta semclaimcomplete cobertos. Allowlist30/scans/diff aprovados; sem chave real/HTTP/deploy. Próxima T22c7 manifestoBANK validado e vinculado antes de aplicar convenção monetária de transações, sem inferir kindunknown comoBANK.

## T22c7 — done

EXP-18/[plano](../plan/T22c7-BANK-MOVEMENT-MANIFEST.md). Confirmar tipo BANK da fonte e vínculos sem ler dados de saldo/identidade.

T22c7 evidência21/10:1034 testes/typechecks (916 Node +118 Python), sete casos novos. Parser de inventário compartilhado preserva o DTO de descoberta; manifesto BANK usa tipo da fonte, vínculos completos e ordem interna estável, sem acessar saldo/identidade/limite. Crédito/moeda não suportada têm contagens explícitas; limites, UUID com newline, IDOR e integração cursor/AAD sob reordenação foram validados. Allowlist de30fontes, scan de perfis e diff aprovados. Sem rede/deploy/env. Próxima T22c8: fronteira de rede v2/transactions exclusivamente sob binding/janelas confiáveis, mantendo default sem transações.

## T22c8 — done

SEC-27/[plano](../plan/T22c8-SCOPED-TRANSACTION-NETWORK.md). Permitir rede transacional somente com escopo confiável e gates explícitos.

T22c8 evidência21/10:1041 testes/typechecks (923 Node+118 Python), sete casos novos. Rede v2/transactions só aceita escopo capturado/modo/gates; fixture não faz fallback para fetch. Primeira/next query preservadas, duas janelas mensais aceitas e item/contas restritos ao binding; IDOR/SSRF/filtros/cookies/headers/métodos/abort/redirect/defaultoff e mutações testados. Allowlist30/scans/diff aprovados; nenhum boot/flag/deploy/rede real. Próxima T22c9 transporte Pluggy de movimentos com chave só na closure, consentimento e manifesto BANK antes da página.

## T22c9 — done

EXP-19/[plano](../plan/T22c9-PRIVATE-PLUGGY-MOVEMENT-PORT.md). Integrar transporte de movimentos com chaveAPI privada e envelope multi-conta/janela, somente fixtures.

T22c9 evidência21/10:1054 testes/typechecks (936 Node+118 Python),13 casos novos. Transporte com chaveAPI na closure validou fluxo de4páginas/2BANK/2janelas até stager/ledger, Authcache1/13requests fictícios, fonte mínima sem extras/IDs externos.500movimentos>128KiB/centavos exatos/429semretry/401limpacache/consentimento expirado entre etapas/cursor de outra sessão/onlyCREDIT/IDOR/close/20s/busy/snapshot cobertos. Projeção admite continuação mensal explícita e prefixov1. Cursor/chaves nunca reais; allowlist31/scans/diff aprovados, semHTTP/deploy/featureflag. Próxima T22c10 SQL de progresso entreworkers: claim/commit de página com hashes opacos/limites, depois autoridade de sessão e coordenadorHTTP.

## T22c10 — done

EXP-20/[plano](../plan/T22c10-MOVEMENT-PAGE-PROGRESS.md). Metadados privados de claim/commit de página, sem cursor ou dados financeiros persistidos.

T22c10 pré-publicação21/10:1060 testes/typechecks (938 Node+122 Python), seis casos novos de runner/transporte. DDL+fixtureSQL reais passaram em BEGIN/ROLLBACK:120 páginas nos cenários de limite, ACL/IDOR/nonce/replay/sessão/expiração/capacidade e zero resíduos/owner preservado/schema não persistida. Contagem recebida antes de filtro e ciclo upstream imediato testados. Allowlist31/scans/diff aprovados. Migration13 ainda pendente: aguardarCI deste commit, aplicar pelo runner e executar fixture instalada antes de marcar done.

T22c10 concluída21/10: CI39596337560 success; migration13 aplicada e todos13hashes verificados. Fixture instalada passou com rollback, zero identidades/resíduos e owner preservado; execução paralela não ensaiada, locks/condições SQL revisados. Nenhuma leitura financeira/flag/chave/deploy.1060testes/typechecks preservados. Próxima T22c11 expor sessionId internamente somente após Auth+RPC de sessão válidos, sem alterar DTO público ou compatibilidade de metadados.

## T22c11 — done

SEC-28/[plano](../plan/T22c11-VERIFIED-SESSION-ID.md). Identidade de sessão interna apenas após confirmação remota, sem expor dados de Auth.

T22c11 evidência21/10:1064 testes/typechecks (942 Node+122 Python), quatro casos novos. sessionId interno só após Auth+orbe_has_session verdadeiros; JWT malformado é recusado cedo, user_metadata não fornece autoridade e respostaHTTP não expõe sessão/owner/token/e-mail. Compatibilidade semsid preservada nos metadados legados. Scan/allowlist31/diff aprovados; sem DB/deploy/flags/cliente. Próxima T22c12 resolverSQL transacional com sessão/leaseExpiry e fixture, depois adaptadoresREST de progresso/coordenador.

## T22c12 — done

SEC-29/[plano](../plan/T22c12-MOVEMENT-READ-BINDINGS.md). Resolver service-only de bindings transacionais com sessão/lease reais e limite100; aceite por fixture SQL fictícia com rollback e suite.

T22c12 pré-aplicação21/10:1064 testes/typechecks passaram; DDL+fixture em rollback passou ACL, owner/sessão/lease/revisão, capabilityfalse, sessão expirada, ausência de item/bindings e fronteira100/101. Zero resíduos, owner preservado e zero leituras financeiras. Scan/allowlist31/diff aprovados. Migration14 aguarda CI deste commit antes da aplicação.

## T22c13 — done

SEC-30/[plano](../plan/T22c13-MOVEMENT-PROGRESS-REST.md). Adaptadores fixos resolve/claim/commit; aguarda conclusão deT22c12.

T22c12 concluída21/10:CI39598586577 success, migration14 aplicada e14hashes verificados. Fixture instalada passou em rollback, zero resíduos/owner preservado/zero leituras financeiras. Próxima etapa REST em andamento.

T22c13 concluída21/10:1073 testes/typechecks (951Node+122Python), regressão completa1072 e teste adicional de integração de rede aprovado separadamente. Nove novos casos cobrem gates/configuração, RPCs fixas/snapshots, escopo, claim/commit, MIME/limites, abort/deadline e credenciais na rede própria. Scan/allowlist32/diff aprovados. Sem deploy/chaves/flags ou leituras financeiras. PróximaT22c14 coordenadorHTTP de movimentações.

## T22c14 — done

SEC-31/[plano](../plan/T22c14-MOVEMENT-HTTP.md). Coordenador HTTP autenticado de páginas de movimentações.

T22c14 concluída21/10:1089 testes/typechecks (967Node+122Python; suite1088 e caso extra isolado).16cenáriosHTTP aprovados, incluindo port real com rede fictícia, mínimo interno/sem IDs externos, IDOR/sessão/lease, claim/commit, consentimento, snapshot antes de reAuth, budget de linhas brutas e hashroot compatívelSQL, abort/deadline. Scan/allowlist33/diff aprovados. T22c13 CI39599099479 success. Nenhum endpoint novo ligado/publicado ou flag/chave real. PróximaT22c15 finalizar lease transacional somente com progresso completo e sessão válida, antes de adaptar cliente.

## T22c15 — done

SEC-32/[plano](../plan/T22c15-MOVEMENT-FINALIZATION.md). Finalização segura do lease após paginação completa.

T22c15 pré-aplicação21/10:DDL+fixture em rollback aprovado, zero resíduos/owner preservado/zero finanças. Cobertos ACL, sem progresso/inflight, bloqueio do successgenérico incompleto, final completo, sessão diferente/expirada e repetição.1089 testes/typechecks da etapa anterior preservados; HTTP CI39599686076 success. Scan/allowlist33/diff aprovados. Migration15 aguarda CI deste commit, depois aplicar e repetir fixture de movimentos e leases legados.

## T22c16 — done

SEC-33/[plano](../plan/T22c16-MOVEMENT-FINALIZE-HTTP.md). Endpoint de finalização com sessão e transporte RPC fixo.

T22c16 concluída21/10:1098 testes/typechecks (976Node+122Python), regressão completa aprovada. Nove casos novos de RPCfinish/rede própria, disabled, sessão dupla/alterada, corpoestrito, recusas genéricas, abort/deadline. Scan/allowlist34/diff aprovados. Sem runtime/deploy/flags/chaves. T22c15 CI39599955417 success, aplicação/fixtures em execução; confirmar resultado antes do checkpoint. PróximaT22c17 orçamento JSON cliente exclusivo de movimentações e operações fixas.

T22c15 aplicada21/10:15hashes verificados; movement-pages e read-leases instalados passaram em rollback, zero resíduos e owner preservado. Sem leitura financeira, chaves/flags ou deploy.

## T22c17 — done

SEC-34/[plano](../plan/T22c17-MOVEMENT-CLIENT-JSON.md). Budget JSON específico e operações fixas de movimentações no cliente.

T22c17 concluída21/10:1104 testes/typechecks (982Node+122Python), seis novos cenários de tetoUTF8 exato1MiB/overflow/chunks/MIME/abort, rotas, origem, lock e limites das demais operações. Exportação iOS e auditoria1205fontes/56pacotes aprovadas; raízes de advisories ausentes do JS, sourcemaps privados. Scan perfis+dist/allowlist34/diff aprovados. Nenhuma UI/gate/EAS alterada. PróximaT22c18 transporte transacional que valida manifestoBANK interno contra registroRLS e mantém manifesto estável porlease, antes de adaptar stager.

## T22c18 — done

SEC-35/[plano](../plan/T22c18-MOVEMENT-TRANSPORT.md). Transporte cliente sequencial com manifesto interno estável por lease.

T22c18 concluída21/10:1112 testes/typechecks (990Node+122Python), oito casos novos. Manifesto interno1–100/subconjunto do registry/ordenado/estável, tentativas únicas/cursor/escopo e snapshot validados; lock interrompe transporte pendente sem nova rede. Scan/diff aprovados. Módulo isolado, ainda não importado no runtimeUI; artefatos/export da17 permanecem válidos e não foram repetidos. CI da17 39600673463 success. PróximaT22c19 criar stager apenas após manifesto da primeira página e promover ledger só após finalizar lease.

## T22c19 — done

SEC-36/[plano](../plan/T22c19-MOVEMENT-BATCH.md). Orquestração com staging criado após primeira página autorizada.

T22c19 concluída21/10:1120 testes/typechecks (998Node+122Python), oito casos novos. Duas contas e registry com cartão excluído sem prefetch adicional; falha na última página/finalização preserva ledger anterior; driftmanifesto/owner/instituição/mês são recusados, lock impede promoção e fecha store permanentemente. Contexto capturado e cache só promove apósfinish/fresh. Scan/diff aprovados. CI da18 39601141539 success. Sem runtimeUI/env/export/deploy. PróximaT22c20 boot backend/roteamento de movimentações com gates e rede capturada por escopo, mantendo entrypoint off.

## T22c20 — done

SEC-37/[plano](../plan/T22c20-MOVEMENT-BACKEND-RUNTIME.md). Boot backend de movimentações com rede restrita ao contexto autorizado.

T22c20 concluída21/10:1126 testes/typechecks (1004Node+122Python), seis novos cenários de boot completoRPC/providerfake, gates/chaves distintas/redeporbinding, acquire com contasoff, IDOR/cap4/close. Scan/allowlist35/diff aprovados. Provedor scoped fechado porpágina: quatro chamadasfake/page (Auth/item/accounts/transactions), sem cachefinanceiro; zero chamadasreais. Entry pointliteralfalse intacto. CI da19 39630094209 passou testes, mas falhou expo install--check por novos patches recomendados expo57.0.31/router57.0.29; não é erro de testes. PróximaT22c21 atualizar patches compatíveis SDK57 e rever export/audit/fontesafetadas, sem suprimircheck. Depois controller/runtimecliente protegido.

## T22c21 — done

SEC-38/[plano](../plan/T22c21-EXPO-PATCH-COMPATIBILITY.md). Correção prioritária de compatibilidade Expo apontada pela CI.

T22c21 evidência21/10:1126 testes/typechecks preservados, install--check/audit/exportiOS/runtimeaudit1205/56/scan/diff aprovados. Atualizados somentepatchesdiretosExpo57.0.31/Router57.0.29 e transitivas do lock; relatório de delta/hashfontesFetch em docs/security/EXPO-PATCH-REVIEW-20261021.md. Advisories19/2 permanecem; sem extensão/supressão. CI da20 39630744182 também falhou só em expo install--check; conferir CI deste commit antes de publicação. Sem EAS/env/flags/deploy. PróximaT22c22 controller de movimentações protegido pela sessão/tela.

## T22c22 — done

SEC-39/[plano](../plan/T22c22-MOVEMENT-SESSION-CACHE.md). Integrar batch com manifesto tardio ao cache de sessão existente antes do controller.

T22c22 concluída21/10:1132 testes/typechecks (1010Node+122Python), seis cenários novos de promoção, ownerlocal/mutex entreprodutos/cancel/lock/close e finishfalse preservando cache. ExportiOS/runtimeaudit1206fontes/56pacotes/scans/diff aprovados. CIpatch21 39631360134 success, corrigiu incompatibilidade sem suprimircheck. Nenhuma UI/flag/deploy/EAS. PróximaT22c23 controller de movimentos com status/registry/proteção e cache.runMovements.

## T22c23 — done

SEC-40/[plano](../plan/T22c23-MOVEMENT-CONTROLLER.md). Controller e runtime protegidos para futura ligação da tela.

T22c23 concluída21/10:1144 testes/typechecks (1022Node+122Python),12cenários de controller/runtime. Prontidão/lock/background, metadadoscapacidade/consentimento, registry, mês, timeout120s/únicorefresh e ausência de rede automática validados. Snapshot sem valores; queryledger protegida; contextoowneropaco. Scan/diff aprovados; módulos isolados sem importUI/exportrepetido. PróximaT22c24 rota Minhasmovimentações+flagliteralfalse e navegação discreta, com filtros de período/direção, parcial e proteção.

## T22c24 — done

SEC-41/[plano](../plan/T22c24-MOVEMENT-SCREEN.md). Tela privada com gatesfalse, sem consulta real na prévia.

T22c24 concluída21/10:1144 testes/typechecks preservados; tela e flagliteralfalse typechecked/exportadas. Runtimeaudit1210fontes/56instâncias, rootsadvisoryausentes/mapsprivados/scans/diff aprovados. Navegaçãoacesso/contas, períodoBrasília2000–2099, moeda/banco,20porpágina e descrição/valor ocultos. Nenhuma consulta comgatesoff, nem misturaDemo. CI23 39632140130 e22 39631758791 success. UI física fica no roteiro final. PróximaT22c25 validação sintética integrada cliente→backend→providerfake→ledger com payload>128KiB, sessão/finishfalhos, antes da publicação.

## T22c25 — done

[Plano](../plan/T22c25-MOVEMENT-INTEGRATED-VALIDATION.md). Validação conjunta da cadeia cliente/HTTP/backend/providerfictício/ledger, além dos testes de módulo.

T22c25 concluída21/10:1148 testes/typechecks (1026Node+122Python), quatro cenários integrados.500movimentos atravessaramSessionModel→runtime/controller→HTTP→backendfixture→Auth/RPCfake→Pluggyfake→HMAC/projeção→ledger; DTO>128KiB e<=1MiB,29centavosexatos, scopeopacolocal distintoAuthowner e nenhumextra/IDexterno noDTO. Nenhuma promoção antes de finish; recusa/lock descartam; gateoffzerochamadas. SQLnãoéprovadopelaRPCfake; fixtures reais15migrations já passaram separadamente. Scan/diff aprovados; CI24 39632749109 success. Sem exportrepetido/EAS/rede financeira. PróximaT22c26 ampliar scanner privado para chaves de movimentos antes de provisionar qualquer chave.

## T22c26 — done

SEC-42/[plano](../plan/T22c26-MOVEMENT-KEY-SCAN.md). Estender guard de publicação antes de criar qualquer chave de movimentações.

T22c26 concluída21/10:1154 testes/typechecks (1026Node+128Python), seis novoscenários de coletaformato/permissões/canáriosfonte/export. Scanner lê perfilopcionalduaschaves semoutput, recusa64hexinválido/nulo/igual; backendartifacts bloqueia qualquer valorprivadoconhecido excetorefpúblico. Scanrealperfis/fontes/dist e diff passaram. Nenhuma chave/perfil real criado, nenhum provisionamento/deploy/ativação. CI25 39633238141 success. Próxima plano de adaptadores investimentos/reservas baseado em fonteoficial, mantendo cobertura desconhecida e sem ler bancos pelas ferramentas.

## T23c0 — done

PORT-11/[plano](../plan/T23c-INVESTMENT-ADAPTER.md). Pesquisa primária21/10 e escopo do adapter de investimentos/reservas. CoberturaOF por conector separada da direta e do consentimento; bruto/líquido, recursos/status e cofrinhos sem heurística documentados. Docs-only, sem novo teste/rede autenticada/financeira. PróximaT23c1 projeção pura vinculada e snapshotúnico.

## T23c1 — done

PORT-11/[plano](../plan/T23c1-INVESTMENT-PROJECTION.md). Projeção pura de snapshot vinculado de investimentos.

T23c1 concluída21/10:1166 testes/typechecks (1038Node+128Python),12casos novos. Snapshotvinculado/contadores exatos, bruto/líquido29c/baseNet/null/negativos/limites, IDOR, dedupeconflito, moedaausente, statusnãoativo, datasestritas, classes porType e gettersPII nunca lidos. Projeção→normalizador→MemoryAssets preserva valuation e subtotalreconciliado0 por relaçãounknown. Scan/allowlist36/diff aprovados; semHTTP/SQL/env/deploy/exportnovo. CIc0 39634489441 success. PróximaT23c2 redeinvestment comitem/página fixos (builder investmentsjáexiste), disablednãoinspeciona, nãoampliarproducts.

## T23c2 — done

SEC-43/[plano](../plan/T23c2-INVESTMENT-NETWORK.md). Rede de investimento por item/página, sem acesso real.

T23c2 concluída21/10:1172 testes/typechecks (1044Node+128Python), seis novoscenários. investmentScope item/page1–100 capturado com política explícita, destinocanônico pageSize100, defaultoff/unusedscope, escoposduplosnegados, contas/transações/resources/identity e SSRF/cookies/redirect/writes proibidos eminvestmode. Scan/allowlist36/diff aprovados. Semprovisionamento/HTTPreal/deploy. PróximaT23c3 metadata/RLS/staging/resolver de posições sem valores.

## T23c3 — done

PORT-12/[plano](../plan/T23c3-POSITION-BINDINGS.md). Registro de posições e contexto autorizado sem valores financeiros.

T23c3 pré-aplicação21/10:1176 testes/typechecks (1044Node+132Python; suite+runner42testes após reforço dosasserts), quatrocasosnovosrunner. DDL+fixture real emrollback passou RLSowner/sessãoexpirada/foreign, ACL, stageestrito/atomicidade/IDsestáveis, fronteira1000/1001, FKowner/produtoreserveproibido ecapinvestfalse comleasecontasválido. Zeroresíduos/ownerpreservado/schema não persistida/zero finanças. Scan/allowlist36/diff aprovados. Migration16 aguarda CI deste commit para aplicar e repetirfixtureinstalada. Próximac4a verificadorprodutoItem (accountsdefault/transactions/ investments) antes do portinvestimentos; hoje default exigeACCOUNTS e movimentosnãoexigemTRANSACTIONS noItem.

## T23c4a — done

SEC-44/[plano](../plan/T23c4a-ITEM-PRODUCT-GUARD.md). Exigir produto específico antes de consultar coleção.

T23c3 aplicada21/10:CI39636931521 success,16hashes verificados e fixtureinstalada passou emrollback/zeroresíduos/ownerpreservado/zero finanças. Registro de posições vazio de dadosreais, nenhumfontecoletada ougateativado.

T23c4a concluída21/10:1178 testes/typechecks (1046Node+132Python), dois casosnovos. Verificador accountsdefault preservado; transactions exigeACCOUNTS+TRANSACTIONS e investimentosaceitaINVESTMENTS semACCOUNTS. Movementport semproduto transacional fazsóAuth+Itemfake, nenhumGETcontas/tx. Scan/allowlist36/diff aprovados. Semdeploy/rede financeira. Próximac4b orçamentoJSON exato1MiB nomeado para investimentos, default128KiB mantido; depoisc4c portproviderpaginado/stagingtécnico.

## T23c4b — done

MPG-INV-01/[plano](../plan/T23c4b-INVESTMENT-JSON.md). Decoder e reader explícitos por página de investimentos.

T23c4b concluída21/10:1181 testes/typechecks (1049Node+132Python), trêsnovoscasos.100posições comextras>128KiB chegam porreadernomeado/decoderinvestmentsexato e projetam29c; tetoUTF81MiB/overflow/MIME/preabort e default128KiB preservados. Scan/allowlist36/diff aprovados; semport/deploy/env/coleção real. CIc4a 39637672088 success. Próximac4c preparar snapshotprivado validado antes de staging de IDs, depois portcollector paginado/cicloAuth.

## T23c4c — done

PORT-13/[plano](../plan/T23c4c-PREPARED-INVESTMENTS.md). Validar dados antes de registrar vínculos, sem expor payload financeiro ao callback.

T23c4c concluída21/10:1184 testes/typechecks (1052Node+132Python), trêsnovoscasos de handlegenuíno/clones/discard/semvalores/snapshotimutável/invalidosemIDsstaging/gates. Wrapper e15casosanteriores preservados. Dadosmínimosfinanceiros ficamemWeakMapprivado e sóprojetam apósbindingsreais; handleexpõeIDs técnicos/contagem. Scan/allowlist36/diff aprovados. CIc4b 39638051009 success. SemHTTP/deploy/env. Próximac4d collector limitado de páginas com callbackIDsapenas; depois integrarAuthclosure.

### T23c4–c6 — entrega consolidada de investimentos (21/10/2026)

Implementados collector paginado/exato, port com APIkeyprivada/consentINVESTMENTS/deadline20s, staging após validação integral, RPCsfixos, handlerHTTP/Authduplo/contextopósstage/commit e finishdedicado, runtime/flagORBE_INVESTMENT_READS_ENABLED (off). 13cenários novos transporte+HTTP+REST, checkcompleto aprovado `/tmp/orbe-check-investment-backend.log`, tiposbackend aprovados após runtime. Migration17 nova: claimúnico/sessão/lease/commit≤1000/finish; genericfinishpreserva proteção de movimentos. DDL+fixtureSQL passaram comrollback/zeroresíduos/ownerpreservado/zeroGETfinanceiro. Ainda não aplicada: aguardarCI e rodarfixtureinstalada. Próxima c7/c8 cliente integrado. Não publicado nem ativado.

### T23c7/c8/c10 — cliente integrado de investimentos (21/10/2026)

RegistryRLS próprio pósstage, JSON1MiB exclusivo, transporteone-shot/finalizaçãodedicada, stager tardio e runInvestments compartilhando mutex/abort/guards de sessão. Controller/runtime/tela Meusinvestimentos com bruto/líquido/data/null/moeda/banco/paginação20/ocultação e gatefalse. Copy de acesso ajustada para não afirmar bancos desconectados. Testeintegrado1000posições→HTTP→registry→cache com29/39centavos e DTO>128KiB passou; finishfalse/registryausente/lock impedem promoção, offzerorede. Checkcompleto1201 (1069Node+132Python) aprovado, exportiOS aprovado. Auditoriaatual1216fontes/56instâncias/aprovaçãosemadvisoriesJS/mapasprivados; nenhuma leiturareal/ativação. BackendCI39641198955success; migration17 aplicada/17hashes e fixtureinstalada positionbindings/progress rollback/zeroresíduos/ownerpreservado aprovados. Cofrinhos c9 ficam explicitamente indisponíveis semprova de fonte; semfingir implementação por heurística. Próximo publicarconsolidadooffapósCI/exportaudit.

### Publicação consolidada — 21/10/2026

Backend orbe-bridge v7 ACTIVE publicado com `liveApproved:false`; sete smokes existentes e quatro novas rotas de movimentos/investimentos retornaram503/no-store/payloadmínimo, zero leitura financeira/provedor. Metadata v4 preservada. CIcliente39642075250success, commit e33928e. PublicaçãoExpo iniciada após CIverde; manifesto/HBC/QR serão conferidos antes de anunciarlinknovo.

Publicação concluída: update01a15f77-2cb3-7872-a3e3-49625880255e/grupoa5771241-b969-4c16-8b56-b6d085ba302e/commite33928e. Manifesto/schemeorbe/hashHBC/QRoficial conferidos. QR21/10 e EXPO-PREVIEW atualizados. Bridgev7off/metadata4/17migrations/1201checks. Nenhuma flag real ativada, nenhuma finança consultada. Entrega técnica de investimentos concluída; c9 sem cobertura confirmada da fonte, gates externos/runtime descritos em RELEASE-READINESS.

### T75a — preparação operacional da ativação (21/10)

SpecSEC45/planT75. HelpermovementkeysCSPRNG32bytesdistintas/criaçãoúnica/checksemgerar/600/700/singlelink/nofollow/semstdoutprivado. financial-config inclui11targets/seisflagsfalse, valida chaves antesderede, recusa conflito/flagtrue, preservadigests/fontes/receipts.41testesfocadosaprovados, scannercomnovascanáriaspassou; perfilprivadorealcriado, zerorede/finanças. ConfigremotaaguardaCI. T75b: fontesoficiais revalidadas; doisadvisoriesseguemsempatch, proxy/resources não provamorigemoriginal, lacunasfornecedorpersistem. Recheck documentado semcontatofornecedor/GETfinanceiro/ativaçãodefachada.

T75a remota concluída:CI39643339822success/configready/11digests/seisflagsfalse/bridge8metadata5/fontespreservadas/7smokes503-no-store. Primeiratentativanãoconcluiuconferência, reconciliaçãoidempotenteadicionou0econfirmoutudo; semrotação. T75c: titular confirmouOFdosdoisbancos. HelperdiagnósticosóPOSTauth/GETitem/GETconsentsdeitemconhecido,6testeslocaisaprovados, saídaapenasflagstécnicas. Quatroexecuçõesduranteanálise(4Auth+4item+4consents), nenhumproduto/PII/valor/IDnasaída. MPupdated/proxyvigente/3produtossolicitados; consentretornaitemIddivergente eérecusadoparaativação. Bradescoitemcontinuanãoidentificado. Perguntatécnicaexternaprontanãoenviada,semclaimfalsodeativação.

T75c fechamento:commitc5c6391/CI39681820386success,1212verificações(1069Node+143Python)/tipo/export/runtimeauditCI aprovados. Gitmainatualizado. AplicativoeQRinalterados; configuração11digests/seisflagsfalse pronta. Ativação permanece bloqueada pela associaçãoAPI de consentimento e itemBradesco não identificado, além dos gates de segurança já documentados. ConfirmaçãoOF do titular registrada; não repetirpergunta/novos testes ouGETs como substituto dessaspendências.


## T76 — ativação pessoal solicitada em21/10

- [x] Spec/plan de ativação e transiçãoSQL18.
- [x] Resolver associação proxy→consentimento→originalOF606 por metadados restritos.
- [x] APIserver-only/duploAuth/SQLatômico e ação noapp, testes unit/integration/DDLrollback.
- [x] Política de liberação pessoal, kill switch, operações enable/disable e guardas publicação.
- [x] Check/export/audit/scan e CI39684158931/39684619830success;1231verificações finais.
- [x] Aplicar18 e fixture remoto revertido/zeroresíduos/ownerpreservado.
- [x] Deploybootstrapguardado/configdisabled/liberaçãopessoal/smokes:bridge15/metadata11/8flagstrue/9anônimos401.
- [x] PublicarQR remoto e documentação de uso/resultados: update01a16085-76f7-7f3b-a8a1-07690266d832/manifesto+hashHBC+QRverificados.
- [ ] Confirmar primeirovalor noaparelho titular (final, não bloquear trabalho independente).

Responsável integrador único; paths/aceites em plan/T76-CONNECTION-ACTIVATION.md. Bradesco ainda sem proxy de aplicação; cofrinhos/reportsreais separados conforme cobertura, não prometerfinalização dessaslacunas.


## T76e — reparar sequência preparação/ativação (23/10)

- [x] Investigar com metadados reais e logs agregados: ativações90s/44s antes do inventário, preparação real confirmada.
- [x] Spec MPG-ACT-03/planT76e e ação única comcancelamento/kill switch/SQLpreservado.
- [x] Typecheck e11testesintegrados, incluindo falha/cooldown/lock/ordem.
- [x] Export/audit/scan/CI39949557277success/1236verificações e nova publicação remota: update01a168a0-4d1f-7f99-8e92-064aff836b64.
- [x] QR23/10/guias/STATE/Git atualizados; confirmação física permanece para titular, sem pedir novasconfigs.


## T76f — leitura após ativação (23/10)

- [x] Ativação confirmada pelo titular e metadados active/rev2; localizarparser recusando datasSQLoffset.
- [x] Spec MPG-READ-01/planoT76f; normalização estritaRPC emcontas/investimentos.
- [x] Regressão handlercomshapeSQL→providerfictício→DTO, calendário/fusoinválidos recusados.
- [x] Check/scan/CI39966769243success/1240checks; disable/deploy/enable18/13,8flags/digests/fontesverificados e9smokesanônimos401.
- [x] Guias/STATE/Git e versõesremotas; cliente/QR preservados. Uma lease expirada afetada foi marcadafailed/retentativaliberada, sem mudarautorização ouvalores.


## T76g — motivo das movimentações ausentes (23/10)

- [x] Titular confirmou saldo funcionando apósT76f.
- [x] Verificar metadados: última lease success/completa, transactions disponível, cooldown769s, nenhum lote de movimento iniciado.
- [x] Titular confirmou mensagem de intervalo. Regra vigente900s porconexão compartilhado entreprodutos; guias/STATE atualizados, sem mudança de código/flags/QR.
- [ ] Leitura real de movimentos após intervalo ainda não confirmada; não confundir cooldown com fonte vazia ou falha Pluggy.


## T77 — home financeira e sincronização automática (23/10)

Spec010/planT77, integrador único.

- [x] T77a: migration19/protocoloopcionalproduto/limite30s eleaseexclusiva120s, clienteantigocompatível; SQLdraft+fixture emrollback/zeroresíduos/ownerpreservado.
- [x] T77b: hub/providerroot/cacheporsessão/filaúnica/autoaoabrir+15min, retry30s/60s e purgebackground/lock.
- [x] T77c: homereal/account, subtotais/moedas/bancos/cofrinhosexplícitos/5movs2meses, detalhesreusamcache e fila.
- [x] QA1248verificações/tipos/exportiOS/audit1220fontes/56instâncias/scansprivados.
- [x] T77d: CI39981649710/39983257856;19migrations+fixture; bridge21/metadata15/digests/fontes/9smokes401; Expo01a16982-acae-7fbf-bf18-f3dda38e795a/manifesto/HBC/QRverificados; docs/STATE/Git.

## T78 — correção dos valores indisponíveis

- [x] Spec MONEY-02/planoT78: preservar home e detalhes; diagnosticar apresentação sem consultar finanças.
- [x] Formatador pt-BR determinístico, centavos exatos e moeda explícita, sem Intl. Regressão de runtime sem Intl/incompleto/comerro; null/oculto/inválido continuam distintos.
- [x] Check completo, export iOS, scan de perfis privados.
- [x] Auditoria final/CI39985350908/1249checks/publicação01a1698f-3e7b-762f-bbf8-49a2c9dc8c12/manifesto/hashHBC/QR/documentação. Aceite físico pendente.

## T79 — bancos, investimentos e identidade pessoal

- [x] SPEC010BANK01/INV01/RES01/UI01 e planoT79.
- [x] Diagnóstico somente metadados: um vínculoMPativo, investimentos success/committed/0linhas; Bradesco sem vínculo próprio. Pesquisa oficialAPIguide e issue22cofrinhos aberto.
- [x] Recibos por conexão/produto/revisão, limpeza e preservação após falha; estados de investimentos sem fingir zero.
- [x] Tema grafite/violeta centralizado, home e bancos distintos, telas existentes/login/proteção coerentes; guiaBANK-COVERAGE.
- [x] 1252checks/types/export/audit1222fontes/56instâncias/scans/contraste≥4.5.
- [x] Após titular fornecer IDprivado, validar proxyBradesco→consentimento→origemOF603 e cadastrar pending; MPpreservado/inventário2bancos confirmados, sem finançasportools.
- [x] CI39987827224success/publicação01a1699f-4286-78c5-8c69-8b8a4fb073f1/manifesto/HBC/QR/documentação.
- [ ] AtivaçãoBradesco e aceite visual no iPhone pelo titular.

## T80 — cartões e faturas (mapeamento solicitado)

- [x] SPEC011 e planoT80a–i com fontes oficiais, contratos de faturas/CREDIT, orçamentozero e segurança.
- [x] Registrar lacuna atual: CREDIT excluído de saldos e manifesto de movimentos; sem integração completa ou ativação de cartão.
- [ ] T80a–i: implementar em sequência conforme plano; não confundir planejamento concluído com recurso disponível.

## T81 — carteira automática e cache local

- [x] SPEC012/planoT81; autorização posterior do titular remove confirmação adicional Orbe para conexões bancárias já aceitas.
- [x] CacheAES256GCM/Keychaindeviceonly/doisslots/owner+projeto/30dias/4MiB, logout/clear com fencing, restore validado e purgememória preservando ciphertext ao fechar.
- [x] Hub restaura e evita leitura recente duplicada, invalida mudançafonte/revisão, prepara pending autorizado na sessão; pausado/revogado não reativam.
- [x] Adicionar banco peloapp/WebView/connector200/callbackvalidado; suporteNubank612/tickets técnicos/migration20. Sem ItemID pelochat no fluxo normal.
- [x] Testes sintéticos de cifra/tamper/owner/projeto/logout/restore/callbackNubank/forjados/URLs/SQLdraftrollback semresíduos/ownerpreservado.
- [x] QA1270/CI39992630145/migration20+fixture/backend24/17/11smokes401/QRupdate01a169c1-09cf-7835-9041-7aaa0218c70b/manifestoHBC.
- [x] Nubank validadoOF612 e vínculo cadastrado; MP/Bradescoativos preservados.
- [ ] Aceite físico: cache/Connect/primeiraleituraNu na sessão titular.
