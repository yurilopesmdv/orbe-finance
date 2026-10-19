# Desenvolvimento do Orbe

Base SDK57 compatível com Expo Go57.0.9 do proprietário. Usar Node22.23.2 e npm12.2.0; não alterar default do projeto F1. Somente sintéticos. Nenhuma variável/secreto ou backend necessário para a tela inicial.

```sh
nvm use
npm ci --ignore-scripts
npm run check
npm run export:ios
npm start
```

Abrir pelo Expo Go no iPhone da mesma LAN privada usando QR/URL exibido pelo Metro. Não usar npm run ios em Linux esperando que ele abra simulador iOS; não há Xcode. Não habilitar túnel por padrão. Primeira tela deve mostrar AMBIENTE DE DEMONSTRAÇÃO e informar que nenhum banco está conectado. Reiniciar o processo não deve apresentar login ou finanças reais.

T07 valida typecheck/testes/exportação no host; abertura no iPhone e acessibilidade física precisam de registro separado. Se o Expo Go atualizar seu supported SDK, revisar runtime antes de migrar. Face ID e armazenamento financeiro real continuam fora do ambiente inicial.

## Organização

src/app contém somente rotas/layouts, src/config configurações públicas sem segredo; domínio/features/repositórios entram nas respectivas tasks conforme plan/T01-RUNTIME-STRUCTURE.md. spikes/access é experimento isolado e não autenticação do app. tests/fixtures contém somente casos inventados. Nenhuma integração com ambiente F1.

Nunca instalar SDK Pluggy ou chave privilegiada no cliente. Ponte futura é de leitura e exige autorização própria. Nenhuma configuração de demonstração deve ser alterada para usar contas reais antes dos gates documentados.

## Backend local (T08)

Requer Docker acessível e CLI2.121.0 resolvido pelo npm. npm run backend:start cria somente a rede orbe-finance-local com bind127.0.0.1 e inicia os serviços desse projeto. npm run backend:status consulta o estado sem imprimir chaves; npm run backend:stop para somente esse projeto, sem apagar seus dados/volumes. Saída completa contém chaves locais e fica em .supabase-local-*.log ignorado pelo Git; não enviar esses arquivos ao chat/CI.

API54341, Postgres54342, captura de email54344, todos locais. Nenhum projeto remoto vinculado; helper rejeita referência cloud. Cloud e teste final no iPhone exigirão destino próprio e TLS/configuração aprovados, sem usar banco F1. Não usar --no-backup, db reset ou remoção de volume em outro projeto para limpar esse ambiente.

## Backend cloud próprio (19/10/2026)

Projeto orbe criado pelo titular, região us-east-1, destinado apenas a desenvolvimento de Auth/metadados. Não conectado a bancos e não aprovado para dados financeiros reais. O arquivo .env.backend.local (modo0600, ignorado) contém SUPABASE_ACCESS_TOKEN e SUPABASE_PROJECT_REF; não usar esse segredo em .env.local ou EXPO_PUBLIC. Expo não precisa dele. Python3 é necessário para administração e testes das proteções; a CI não recebe credenciais.

`npm run backend:cloud:inspect` verifica destino/metadados/política sem imprimir segredos. `npm run backend:cloud:bootstrap` é preparação idempotente de banco vazio e rejeita tabelas de aplicação existentes. Confere nome/ref/saúde, aplica baseline imutável pelo endpoint de migrations e registra nome com hash no histórico oficial. A versão remota é gerada pela API; não executar CLI db push remoto por divergência com timestamps locais. Novas migrations precisam de operação versionada própria antes de aplicar. Não editar a baseline aplicada.

Cadastro público, anônimo e telefone estão desligados; senha mínima12, JWT10min e rotação configurados. Nenhuma identidade proprietária provisionada por ferramenta até esta etapa; T10 usa cadastro administrativo do titular e allowlist server-side. SMTP/recuperação e retenção do provedor continuam pendentes. Stack Docker local segue parada pelo problema de bind já documentado.

### Migrations e proprietário

`npm run backend:cloud:migrate` exige baseline já aplicada, verifica todos os hashes antes de aplicar novas migrations versionadas e confere o histórico. Nunca editar migration aplicada. `npm run backend:cloud:test-owner` executa somente tests/admin/owner-access.sql: identidades inventadas em transação com rollback, papéis authenticated/anon e verificação de resíduos. Não usar para homologar banco real.

Para provisionar proprietário: titular cria a conta em Authentication → Users → Add user → Create new user, senha>=12 e Auto Confirm User; adiciona ORBE_OWNER_USER_ID no arquivo privado .env.backend.local. `npm run backend:cloud:set-owner` valida UUID, conta confirmada/não anônima e rejeita substituição de dono existente. Nenhuma senha/e-mail é lida pela ferramenta. Registro privado singleton não é acessível pelos clientes; função public.orbe_is_owner retorna apenas autorização da sessão atual. Ausência de proprietário nega todo acesso privado. Não concede acesso por chave pública ou e-mail enviado pelo app.
