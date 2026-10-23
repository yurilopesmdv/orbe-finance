# Orbe — nova home financeira no Expo Go

Publicação de23/10/2026, iOS/SDK57, remota e independente do PC ou rede local.

![QR da home financeira](assets/orbe-expo-go-home-20261023.png)

Link direto: exp://u.expo.dev/update/01a1699f-4286-78c5-8c69-8b8a4fb073f1

Update01a1699f-4286-78c5-8c69-8b8a4fb073f1 · grupo31b0f9b0-c871-4392-9b54-340ded3a3965 · commit421cc9a98cd72901c9154a16bcdba44c8028b3f8 · EAS69843dfe-ab1b-469e-bb78-c7948bbf1d9b · preview · runtimeexposdk:57.0.0.

## Identidade e cobertura — T79

Tema grafite/violeta, bancos separados, estados por produto e atalhos preservados. CI39987827224success/1252checks (1104Node+148Python), tipos/export/audit1222fontes/56instâncias/scans e contraste≥4.5; manifesto/scheme/hashHBC/QRoficial verificados.

Mercado Pago ativo, valores confirmados pelo titular; leitura de investimentos retornou0linhas. Bradesco já validado e cadastrado pending. No app, **Conexões → Bradesco → Preparar e ativar leitura**; após confirmação, voltar à home inicia as leituras automaticamente. Não precisa importar extratos. [Cobertura e cofrinhos](BANK-COVERAGE.md). Cartões/faturas estão [mapeados emSPEC011](../specs/011-credit-cards/spec.md), ainda sem implementação.

## Usar

Abra este QR com o Expo Go e use sua conta existente. A home privada agora mostra saldo consolidado, subtotais de contas e investimentos, valores por banco e até5movimentos recentes de2meses. Toque **Mostrar valores e descrições** para revelar as informações, inicialmente ocultas. **Ver todas** abre o histórico no período correspondente.

Os dados são carregados automaticamente ao abrir/retomar e atualizados durante o uso. Mudar de página mantém os dados da sessão; as telas completas usam o mesmo cache. Atualizar na home é opcional. Ao retornar à home, as conexões são revalidadas e produtos com cache recente não são consultados novamente.

O intervalo porproduto é30s e não bloqueia outros produtos por15min. Apenas uma leitura por banco fica em andamento. O segundo mês pode aguardar um breve intervalo, com continuação automática. Ao bloquear/background/logout, dados e requisições são limpos; o app recarrega ao retornar. Não há persistência financeira em disco ou processamento em segundo plano.

Investimentos com sobreposição desconhecida ficam separados do consolidado; cofres/reservas não são inventados nem duplicados. Bradesco ainda semproxypróprio identificado. Datas, cobertura e disponibilidade da fonte continuam relevantes; atualização no Orbe não equivale a forçar atualização bancária emtempo real. [Guia completo](FINANCIAL-HOME.md).

## Correção dos valores — T78

O formatador monetário compartilhado agora funciona sem Intl.NumberFormat/formatToParts do aparelho. A mensagem Valor indisponível era também usada para falha de formatação de valores válidos; Não informado continua reservado ao valor ausente. Home e telas completas preservadas. Abra o QR atualizado e toque Mostrar valores e descrições; não precisa refazer conexões. A confirmação no iPhone segue pendente, sem consulta de valores reais pelas ferramentas.

CI39985350908 aprovada, 1249 verificações (1101Node+148Python), tipos/export/auditoria1220fontes/56instâncias/scans; manifesto/scheme/hashHBC/QR oficial conferidos. Backend e banco sem alterações nesta correção.

## Verificações anteriores

CI39981649710success/1248verificações(1100Node+148Python), tiposcliente/backend, SQL/RLSdraft e instalado comrollback/zeroresíduos/ownerpreservado. Ajustefinal de navegaçãoCI39983257856. ExportHermes/audit1220fontes/56instâncias/advisoriesausentesJS, scansprivados/allowlist46; sourcemaps privados. Manifesto/scheme/hashHBC/URLoficialQR conferidos depois de publicar.

Backendbridge21/metadata15,19migrations imutáveis/hashverificadas,8flags ativas/digests/fontes/identidades confirmados.9rotasanônimas401/no-store. Valores reais nunca foram consultados pelas ferramentas; a validação da nova interface no aparelho fica para o titular. Saldo e leitura anterior de movimentos já foram confirmados por titular/metadados, respectivamente. Cadastro público/FaceID/recuperação continuam desligados. Nenhum serviço pago contratado.

[Prontidão](RELEASE-READINESS.md) · [Specs](../specs/010-financial-home/spec.md) · [Roadmap](../roadmap/STATE.md).
