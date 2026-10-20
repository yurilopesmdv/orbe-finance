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

## T51b2c12 — doing

MPG-24/AUTH-16/SEC-25/[plano](../plan/T51b2c12-ACCOUNT-PREVIEW-RELEASE.md), integrador único. Publicar prévia remota da tela contasoff após CI, conferirmanifest/hash/QR e checkpoint final sem pedir teste agora.
