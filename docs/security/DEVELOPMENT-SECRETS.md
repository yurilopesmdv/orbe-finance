# Credenciais de desenvolvimento — T50a

O arquivo administrativo está em `~/.config/orbe-finance/backend.env`. Diretório0700 e arquivo0600, fora do projeto Expo, com SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF e ORBE_OWNER_USER_ID. Nunca enviar seu conteúdo ao chat, Git, CI ou cliente. Para editar nesta máquina: `/home/yurilopesm/.config/orbe-finance/backend.env`. Não é necessário repetir os valores: foram preservados na migração.

`.env.backend.local` permanece privado/ignorado e contém somente `ORBE_BACKEND_ENV_FILE=/home/yurilopesm/.config/orbe-finance/backend.env`. Helpers recusam outro destino, symlink em qualquer ancestral, chaves duplicadas, pointer misturado a segredo e ausência de pointer; não recorrem automaticamente a credenciais globais. Em outra máquina, criar diretório privado e pointer com o caminho absoluto equivalente ao próprio home. Não reutilizar credenciais do F1. `.env.local` continua reservado a configuração pública do cliente.

Expo57 inclui env/local/development nas extensões observadas. Metro só simbolica arquivos conhecidos no grafo, mas isso pode incluir dotenv. `metro.config.cjs` preserva exclusões Expo e remove dotenv/backend.env/credentials.json/.npmrc do grafo, incluindo sufixos JS e diretórios com esses nomes. Teste usa crawler real em /tmp com canários inventados; confirma inclusão padrão e exclusão após correção, mantendo JS público. Não foi feita solicitação HTTP de segredo real nem observado vazamento.

Essa proteção não resiste a dependência maliciosa executada como o usuário, acesso ao sistema ou servidor modificado; não comprova proteção de dados bancários ou homologação de LAN. Nenhum Metro de desenvolvimento foi aberto nessa validação. T50b deve sanitizar ambiente/perfil Expo antes da próxima sessão LAN. Public env é lido diretamente pelo CLI antes do grafo; reiniciar CLI após alterações.

## Launcher suportado — T50b

`npm start` e `npm run ios` iniciam LAN sintética, sem simulador; `npm start -- --localhost --port 8083 --clear` restringe ao próprio PC. `npm run export:ios` usa o mesmo isolamento. Não iniciar teste físico agora: continua reservado à validação final. O wrapper permite somente esses argumentos; túnel/publicação são recusados.

O filho recebe uma allowlist de variáveis do SO e somente três EXPO_PUBLIC conhecidas. EXPO_TOKEN, SUPABASE_ACCESS_TOKEN, AWS/GitHub, NODE_OPTIONS, proxies e outras variáveis herdadas não são transmitidos. Arquivos .env* têm parser estrito, duplicatas/variáveis desconhecidas/symlinks bloqueiam o comando sem exibir valores. `.env.backend.local` contém apenas pointer validado e seu destino não é aberto pelo launcher. Somente arquivos dotenv padrão development/production entram no filho; modelo .env.example não é carregado.

Perfil exclusivo `~/.config/orbe-finance/expo-cli` (0700), `__UNSAFE_EXPO_HOME_DIRECTORY` suportado pelo CLI57 instalado, não altera HOME nem acessa o perfil global Expo. Modo offline, telemetria desligada e dotenv automático desativado explicitamente. Offline vale para o CLI, não impede o app de autenticar no Supabase ou o Metro de atender LAN. Não representa firewall nem sandbox de dependências. Execução direta de `npx expo` ignora estes controles e não é caminho suportado. Teste do módulo real do CLI confirma as quatro opções; processo filho com sentinelas comprova exclusão de tokens.
