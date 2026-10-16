# T01 — Runtime e estrutura do projeto

Estado: done para definição de compatibilidade/paths, 16/10/2026. Requisito PRD-04, correlatos PRD-07/08, PF-08 e AUTH-03/07. Base: 6058f29. Responsável: mantenedor; execução sequencial sem delegação. Escopo desta task: documentação, inspeção local de ferramentas e pesquisa oficial; nenhum bootstrap/instalação/provisionamento.

## Aparelho e runtime definidos

| Item | Seleção / evidência | Limite |
|---|---|---|
| Aparelho | iPhone 11, informado pelo proprietário nesta task | Nenhum identificador de hardware coletado |
| Sistema | iOS 26.6.2, informado pelo proprietário | Ainda sem teste físico do app Orbe |
| Expo Go instalado | Client 57.0.9; Supported SDK 57.0.0, informados pelo proprietário | Verificar novamente se Expo Go atualizar antes de T07 |
| Expo SDK | Linha 57.0.x | Corresponde ao cliente instalado; fixar patch exato no lockfile no bootstrap |
| React Native / React | Linha oficial SDK 57: RN 0.86, React 19.2.3 | Usar dependências compatíveis do template/Expo, sem atualizar RN isoladamente |
| iOS mínimo | 16.4+ conforme tabela oficial SDK 57 | iOS informado atende; versão não substitui teste em aparelho |
| Node selecionado | 22.23.2, já instalado; comando de versão executado | Satisfaz mínimo 22.13.x documentado para SDK 57 |
| npm selecionado | 12.2.0 do mesmo Node, comando executado | package-lock.json único e npm ci na fase de código |
| Shell atual | Node 18.13.0 / npm 8.19.3 | Não usar para Orbe; não alterar globalmente o ambiente do F1 |
| Host | Linux, observado localmente; xcodebuild não encontrado | Sem simulador/build iOS local; primeiro smoke em iPhone via Expo Go |

Decisão: SDK 57, sem adotar latest automaticamente. SDK 58 foi lançado em 15/10/2026, mas as notas oficiais ainda indicam que seu Expo Go chegará às lojas posteriormente. A seleção segue o SDK suportado no aparelho, não a palavra latest do site. Se o cliente mudar, revisar compatibilidade antes de instalar dependências.

Node selecionado existe em /home/yurilopesm/.nvm/versions/node/v22.23.2. Para comandos do projeto, selecionar essa versão em shell isolado; configurar .nvmrc/engines em T07, sem mudar o default de outros projetos. Os comandos de inspeção somente consultaram versões, sem download ou execução de pacote remoto.

## Capacidades e limites

| Recurso | Expo Go inicial | Decisão |
|---|---|---|
| Senha/sessão | Fluxo JS de Auth candidato, sujeito ao spike T02 | Sintético primeiro; nenhum segredo Pluggy no cliente |
| Face ID | Não suportado no Expo Go iOS segundo documentação | Sem botão de sucesso fictício; validar runtime nativo em T65/T46 |
| SQLite | API presente; SQLCipher não suportado em Expo Go | Sintéticos podem usar adaptador de memória; não gravar finanças reais em SQLite aberto para contornar limite |
| SecureStore biométrico | requireAuthentication não pode ser assumido no Expo Go | T02 mantém sessão em memória e exige reautenticação ao bloquear; revisar API da versão antes de usar |
| Armazenamento protegido real | Não homologado | Chaves, SQLCipher, reset, backup/journal e perda de aparelho em T65–T67 |
| Consentimento bancário | Portal oficial, fora do Orbe | Confirmar origem Open Finance antes do uso real; retorno ao app exige reautenticação |
| Metro/debug/rede | Somente sintéticos | Preferir LAN privada; sem túnel/telemetria adicionais por padrão |

Face ID e persistência real protegida permanecem requisitos condicionados ao runtime. Não afirmar que Expo Go oferece todos os controles do produto final. Esta task não autoriza mudar distribuição ou contratar Apple Developer/EAS.

## Paths definidos para implementação

Um app na raiz do repositório, sem monorepo. Estrutura abaixo é contrato futuro, não diretórios já criados:

| Path futuro | Responsabilidade |
|---|---|
| src/app/ | Rotas e layouts Expo Router; somente arquivos de navegação |
| src/features/access/ | Login, recuperação, bloqueio e ciclo da sessão |
| src/features/overview/ | Resumo consolidado e estados de atualização |
| src/features/transactions/ | Movimentos, filtros e revisão de categoria |
| src/features/portfolio/ | Contas, investimentos, reservas e metas |
| src/features/reports/ | Relatórios internos e detalhe progressivo |
| src/features/connections/ | Status, cobertura, pausa/desvínculo e orientação de consentimento |
| src/domain/ | Dinheiro, datas, categorias e reconciliação puros, sem SDK/UI |
| src/data/bridge/ | Cliente tipado da ponte; somente sessão própria, sem credenciais Pluggy |
| src/data/local/ | Contrato de repositório e adaptadores memória/protegido conforme runtime |
| src/ui/ | Tema e componentes compartilhados acessíveis |
| src/config/ | Configuração pública validada e modo sintético por padrão |
| assets/ | Recursos locais empacotados, sem URLs externas ligadas a dados financeiros |
| supabase/functions/bridge/ | Autenticação/autorização e leitura da API Pluggy conforme T74 |
| supabase/functions/_shared/ | Schemas/normalização e helpers apenas do servidor |
| supabase/migrations/ | Schema/RLS de metadados, sem persistência financeira |
| tests/domain/ | Casos financeiros puros inteiramente sintéticos |
| tests/access/ | Sessão, background, expiração e recuperação |
| tests/bridge/ | HTTP simulado, ownership, limites e erros sanitizados |
| tests/data/ | Promoção de lotes, deduplicação e repositórios locais |
| tests/fixtures/ | Dados inventados, sem extrato real nem captura de API de produção |
| docs/validation/ | Evidências sanitizadas por task e limitações observadas |

package.json, package-lock.json, tsconfig.json, app.config.ts, .nvmrc e configuração de checks serão criados quando a task correspondente exigir. Não criar pastas vazias ou dependências antes de usá-las. Contratos compartilhados têm mantenedor único; sem agentes paralelos nesta execução.

## Entrada da próxima task T02

T02 deve limitar-se ao spike sintético de senha/sessão, recuperação e bloqueio do SDK 57, sem bootstrap de produto completo. Definir antes da execução seus paths de spike/testes e framework mínimo; qualquer arquivo temporário fora do app deve ser identificado. Saída exigida: evidência reproduzível de máquina de estados e limites do runtime; mocks não comprovam SMTP/Auth real ou comportamento físico do iPhone. T07 continuará responsável pelo bootstrap do app.

## Validação realmente executada

- Inspeção do repositório limpo na base 6058f29 e leitura das specs/plano/T74.
- Consulta pública de documentação oficial e confirmação do runtime pelo proprietário.
- Linux e versões locais verificados: default Node18/npm8; seleção Node22.23.2/npm12.2.0 executada com caminhos explícitos.
- Links, requisitos, dependências e diff revisados documentalmente.

Não executados: instalação/npm ci, expo-doctor, bundle/typecheck, abertura em aparelho, autenticação real, Face ID, SQLCipher, API bancária ou scan de dependências. Sem package.json/lockfile nesta task, tais verificações seriam prematuras. Task concluída quanto ao seu aceite documental; T07/T38 registram o smoke real.

## Fontes oficiais consultadas em 16/10/2026

- [Matriz Expo SDK / React / Node / iOS](https://docs.expo.dev/versions/latest/).
- [Lançamento SDK 58 e disponibilidade Expo Go](https://expo.dev/changelog/sdk-58).
- [Expo Go na App Store](https://apps.apple.com/us/app/expo-go/id982107779).
- [LocalAuthentication SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/local-authentication/).
- [SQLite SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/).
- [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) — latest ainda exige reconferência da versão escolhida antes de código.
- [Diretório src no Expo Router](https://docs.expo.dev/router/reference/src-directory/).

O número instalado foi confirmado pelo usuário; a página da loja não comprova por si qual versão está no aparelho. Nenhuma captura de tela ou identificador sensível necessário.
