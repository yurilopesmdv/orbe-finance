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
