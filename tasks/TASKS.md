# Microtasks — backlog de implementação

Estado em 16/10/2026: **Concluídas: T74, T01, T02 (20 testes), T03, T04, T05, T47, T48, T49 e T06. Próxima T07.**. Implementação autorizada em 16/10/2026, uma task por vez, após publicação do planejamento. Dependências definem a ordem; contratação e conexão real continuam fora da preparação sintética. T01–T06 são preparações/spikes da fase seguinte; autorizar implementação permite executar as tasks técnicas dentro do escopo aprovado, sem pedir confirmação a cada mudança reversível.

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
