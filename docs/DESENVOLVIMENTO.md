# Desenvolvimento do Orbe

Base SDK57 compatível com Expo Go57.0.9 do proprietário. Usar Node22.23.2 e npm12.2.0; não alterar default do projeto F1. Somente sintéticos. Nenhuma variável/secreto ou backend necessário para a tela inicial.

```sh
nvm use
npm ci --ignore-scripts
npm run check
npm run export:ios
npm start
```

Abrir pelo Expo Go no iPhone da mesma LAN privada usando QR/URL exibido pelo Metro. Não usar npm run ios em Linux esperando que ele abra simulador iOS; não há Xcode. Não habilitar túnel por padrão. Primeira tela deve mostrar AMBIENTE DE DEMONSTRAÇÃO e informar que nenhum banco está conectado. Reiniciar o processo inicia sem sessão; login aparece se a configuração pública estiver disponível. A demonstração sempre é inventada e finanças reais permanecem desligadas.

T07 valida typecheck/testes/exportação no host; abertura no iPhone e acessibilidade física precisam de registro separado. Se o Expo Go atualizar seu supported SDK, revisar runtime antes de migrar. Face ID e armazenamento financeiro real continuam fora do ambiente inicial.

## Organização

src/app contém somente rotas/layouts, src/config configurações públicas sem segredo; domínio/features/repositórios entram nas respectivas tasks conforme plan/T01-RUNTIME-STRUCTURE.md. spikes/access é experimento isolado e não autenticação do app. tests/fixtures contém somente casos inventados. Nenhuma integração com ambiente F1.

Nunca instalar SDK Pluggy ou chave privilegiada no cliente. Ponte futura é de leitura e exige autorização própria. Nenhuma configuração de demonstração deve ser alterada para usar contas reais antes dos gates documentados.

## Backend local (T08)

Requer Docker acessível e CLI2.121.0 resolvido pelo npm. npm run backend:start cria somente a rede orbe-finance-local com bind127.0.0.1 e inicia os serviços desse projeto. npm run backend:status consulta o estado sem imprimir chaves; npm run backend:stop para somente esse projeto, sem apagar seus dados/volumes. Saída completa contém chaves locais e fica em .supabase-local-*.log ignorado pelo Git; não enviar esses arquivos ao chat/CI.

API54341, Postgres54342, captura de email54344, todos locais. Nenhum projeto remoto vinculado; helper rejeita referência cloud. Cloud e teste final no iPhone exigirão destino próprio e TLS/configuração aprovados, sem usar banco F1. Não usar --no-backup, db reset ou remoção de volume em outro projeto para limpar esse ambiente.

## Backend cloud próprio (19/10/2026)

Projeto orbe criado pelo titular, região us-east-1, destinado apenas a desenvolvimento de Auth/metadados. Não conectado a bancos e não aprovado para dados financeiros reais. O arquivo ~/.config/orbe-finance/backend.env (modo0600, diretório0700) contém SUPABASE_ACCESS_TOKEN e SUPABASE_PROJECT_REF; .env.backend.local contém somente o ponteiro ORBE_BACKEND_ENV_FILE para ele; não usar esse segredo em .env.local ou EXPO_PUBLIC. Expo não precisa dele. Python3 é necessário para administração e testes das proteções; a CI não recebe credenciais.

`npm run backend:cloud:inspect` verifica destino/metadados/política sem imprimir segredos. `npm run backend:cloud:bootstrap` é preparação idempotente de banco vazio e rejeita tabelas de aplicação existentes. Confere nome/ref/saúde, aplica baseline imutável pelo endpoint de migrations e registra nome com hash no histórico oficial. A versão remota é gerada pela API; não executar CLI db push remoto por divergência com timestamps locais. Novas migrations precisam de operação versionada própria antes de aplicar. Não editar a baseline aplicada.

Cadastro público, anônimo e telefone estão desligados; senha mínima12, JWT10min e rotação configurados. Proprietário criado pelo titular e allowlist server-side provisionada em T10; ferramentas não usam senha/e-mail do proprietário. SMTP/recuperação e retenção do provedor continuam pendentes. Stack Docker local segue parada pelo problema de bind já documentado.

### Migrations e proprietário

`npm run backend:cloud:migrate` exige baseline já aplicada, verifica todos os hashes antes de aplicar novas migrations versionadas e confere o histórico. Nunca editar migration aplicada. `npm run backend:cloud:test-owner` executa somente tests/admin/owner-access.sql: identidades inventadas em transação com rollback, papéis authenticated/anon e verificação de resíduos. Não usar para homologar banco real.

Para provisionar proprietário: titular cria a conta em Authentication → Users → Add user → Create new user, senha>=12 e Auto Confirm User; adiciona ORBE_OWNER_USER_ID no arquivo privado ~/.config/orbe-finance/backend.env. `npm run backend:cloud:set-owner` valida UUID, conta confirmada/não anônima e rejeita substituição de dono existente. Nenhuma senha/e-mail é lida pela ferramenta. Registro privado singleton não é acessível pelos clientes; função public.orbe_is_owner retorna apenas autorização da sessão atual. Ausência de proprietário nega todo acesso privado. Não concede acesso por chave pública ou e-mail enviado pelo app.

### Configuração pública e Auth do app

`npm run backend:cloud:configure-client` seleciona somente chave publishable e grava EXPO_PUBLIC_SUPABASE_URL/EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY em .env.local ignorado; nunca grava PAT/service role/UUID do dono. Recusa sobrescrever projeto diferente ou variável privada existente. Reiniciar Metro após mudar env pública. .env.example é modelo sem credenciais. Login real confirma /user e RPC orbe_is_owner antes de criar sessão volátil; demonstração continua pública e inventada.

O projeto Free/remetente padrão recusou customizar template (HTTP400). EXPO_PUBLIC_AUTH_RECOVERY_ENABLED=false mantém a recuperação por código indisponível. Nenhum SMTP contratado/email de teste enviado por ferramenta. Recuperação T11c exige SMTP próprio revisado, template Token e entrega comprovada; não ativar apenas mudando flag no cliente.

`npm run backend:cloud:smoke-auth` é opt-in e nunca roda na CI: cria uma identidade inventada com confirmação administrativa (sem email), valida negação do gateway/RPC/anônimo no backend e a remove em finally. Apenas configuração pública/credenciais inventadas chegam ao filho Node por stdin. Não usar conta/senha real do titular nesse comando. O teste positivo do titular e o fluxo físico ficam ao final conforme combinado.

### Bloqueio de sessão

AppState somente active permite autenticar/receber resultados; inactive/background/estado desconhecido limpam sessão e abortam consultas. Voltar active exige novo login. Formulário limpa email/senha/código ao perder active. Expiração usa timer e conferência antes/depois de operações; snapshots React não contêm tokens. Tentativa de logout remoto é best effort, e JWT já emitido pode durar até a expiração; não equivale a revogação instantânea universal.

Teste de ciclo de vida é sintético. Alternador/captura/VoiceOver/gerenciador de senhas e retorno de autorização no iPhone serão validados no final; Expo Go não foi aprovado para finanças reais. Face ID continua indisponível, sem botão falso.

### Metadados de conexão (T13)

public.orbe_connections/orbe_accounts permitem apenas SELECT do proprietário permitido e da própria linha, sob RLS; clientes não cadastram/alteram/apagam vínculos. Campos são IDs internos, instituição/estado/capacidades/moeda/datas; sem valores, números de conta, CPF ou payload. IDs externos ficam em orbe_private.connection_bindings/account_bindings, sem USAGE de anon/authenticated. FKs compostas impedem relação entre donos; service_role só existe no backend.

Capacidade null é desconhecida, false é indisponibilidade confirmada. Conexão active exige data de verificação original de Open Finance; essa coluna não é prova por si e só poderá ser preenchida após homologação. Nenhum item real cadastrado. `npm run backend:cloud:test-metadata` verifica duas identidades inventadas, papéis reais, CRUD proibido, joins/agregados/FKs e rollback; exige dono provisionado, preserva-o e confere zero identidades temporárias. Não roda automaticamente na CI nem requer dados financeiros reais.

### Dados e metas demonstrativos

Ledger/ativos/metas em src/data/local são ports voláteis por principal/geração, sem disco/rede. Detectar sessão inválida numa operação purga e bloqueia; integração privada futura deve chamar close imediatamente ao lock. Não confundir guard injetado com autorização real já integrada. T14b/T15b/T16b dependem do runtime protegido.

A tela Metas usa apenas createDemoGoals, com principal constante explicitamente inventado; nunca reutilizar esse seed/guard para dados reais. Orçamento Bradesco do cenário exclui reserva já incluída. Criar/alocar/excluir só muda organização da sessão; sair da demonstração fecha/reset o store, e recarregar movimentos preserva metas. Nenhuma chamada bancária. parse de formulário mantém centavos exatos e data civil DD/MM/AAAA; title/values são mascarados e campos limpos no background.

Isolamento das credenciais e proteção do grafo Metro: [guia](security/DEVELOPMENT-SECRETS.md).

Comandos Expo passam por scripts/expo-safe.mjs: perfil exclusivo, ambiente sanitizado, CLI offline/sem telemetria e dotenv público estrito. Para alterar host/porta use `npm start -- --localhost --port 8083`; não executar CLI direto ou túnel. Offline do CLI não desativa o login HTTP no app.

## Ponte desligada em desenvolvimento

`npm run backend:bridge:deploy-disabled` confirma projeto/fontes/manifest e publica somente orbe-bridge com gate literal false via API, sem Docker. `npm run backend:bridge:smoke-disabled` valida três respostas503 anônimas. Logs/manifest ficam no diretório privado fora do Metro, nunca no Git. verify_jwt=false vale somente para essa resposta sem dados; não habilitar função ou adicionar operação protegida sem nova task/gates. Detalhes e limites em [ponte](security/BRIDGE-CORE.md).

T20a adicionou a quarta migration; em20/10/2026 são sete migrations aplicadas/imutáveis, lease privado por conexão e fencing de revisão. `npm run backend:cloud:test-read-leases` executa cenários SQL fictícios em rollback e verifica zero identidades residuais/owner preservado. Não imprimir respostas SQL cruas nem editar migration aplicada. Serviço público orbe-bridge continua desligado; RPCs de lease somente service_role, sem ACL direta na tabela.

### Configuração de acesso e conexões —20/10/2026

configure-client grava somente origem/chave pública e recoveryfalse; não altera Auth/template/SMTP e não envia e-mail. T11c continua dependendo de SMTP revisado e entrega comprovada pelo titular. Login → Meu acesso → Minhas conexões consulta somente metadata no endpoint próprio orbe-metadata, com Auth/sessão/RLS. Pausa/remoção têm confirmação/revisão, remoção exige login recente. Não confundir com revogação no banco. Função financeira orbe-bridge permaneceoff. Deploy/manifest metadata são separados (scripts/metadata-deploy.py), logs0600 fora Metro; não executar operações contra outro projeto.

## Teste final atual

[Prontidão/roteiro iPhone](RELEASE-READINESS.md) reúne evidências e bloqueios. Metro iniciado20/10/2026 na porta8083 para aceite sintético, sem túnel, pelo launcher seguro. Sua disponibilidade depende da sessão/processo; confira status antes de usar o endereço. Não afirmar que o teste físico passou sem resposta do titular.
