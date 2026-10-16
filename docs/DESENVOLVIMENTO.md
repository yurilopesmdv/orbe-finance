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
