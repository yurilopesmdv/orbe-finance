# Visão geral financeira — 23/10/2026

A página inicial após entrar no Orbe reúne os dados reais da sessão. Não é necessário atualizar cada tela para começar.

## O que aparece

- Saldo consolidado em moeda selecionada, subtotais de contas e investimentos e valores por banco.
- BRL, USD e EUR separados, sem conversão ou mistura de moedas.
- Até cinco movimentações mais recentes dos últimos dois meses. Ver todas abre o histórico no período do movimento mais recente exibido.
- Conexões e telas completas de contas/investimentos/movimentações com o mesmo cache da home.
- Cofrinhos explicitamente indisponíveis quando a fonte não comprova natureza e vínculo. Investimentos de composição desconhecida são mostrados separados para não contar o mesmo dinheiro duas vezes.

Os valores e descrições começam ocultos. Toque em Mostrar valores e descrições na home para exibi-los. Falha de consulta não vira saldo zero; dados válidos anteriores permanecem enquanto a sessão está ativa. Dados parciais e falta de composição são sinalizados.

## Atualização automática

Ao desbloquear o acesso, o app identifica conexões ativas e atualiza os produtos disponíveis em sequência. Repete o ciclo a cada15min em primeiro plano. O botão Atualizar inicia um ciclo manual pela mesma fila. A consulta do segundo mês pode aguardar30s; o app continua sozinho sem exigir outro clique.

Uma única leitura por banco fica em andamento; a admissão de nova consulta é controlada por banco e produto, com intervalo30s. Atualizar contas não bloqueia movimentações ou investimentos durante15min. Clientes antigos mantêm protocolo e intervalo anterior até serem atualizados.

Mudar de tela não apaga os dados. Isso corrige o comportamento em que uma leitura havia sido concluída mas desaparecia ao voltar à home. Ao bloquear, sair da conta ou colocar o app em segundo plano, as requisições são abortadas e os valores são removidos da memória. Ao retornar, a sessão é validada e os dados são buscados automaticamente. Não existe cache financeiro em disco nem em logs, e não há processamento financeiro em segundo plano.

A atualização no Orbe é uma leitura da informação disponibilizada pela Pluggy; não representa renovação forçada de consentimento nem atualização em tempo real no banco. Disponibilidade, atraso e cobertura da fonte continuam aplicáveis. A conexão Bradesco ainda precisa de seu proxy próprio na aplicação; a home não inventa esse vínculo. Não refaça configurações já válidas.

## Operação e evidências

SPEC-010/planT77. Migration19 adiciona somente metadados de admissão por produto e associa o produto à lease. Owner/revisão/capacidade/consentimento/proteção e singlelease permanecem obrigatórios. Lease de contas não pode ser usada para movimentos. Nenhuma nova credencial, fornecedor, serviço pago, cron ou webhook.

Validação local:1248verificações, tiposcliente/backend, SQL/RLS emrollback/zeroresíduos/ownerpreservado, exportiOS/Hermes, auditoria1220fontes/56instâncias e scansprivados. Testes de fila, timer, cache entre consultas, lock/background/purge, resultado parcial e totais sem duplicação. A confirmação final da nova interface e valores acontece na sessão do titular; nenhuma ferramenta consulta extratos ou valores reais.

[QR remoto](EXPO-PREVIEW.md) · [Prontidão](RELEASE-READINESS.md) · [Especificação](../specs/010-financial-home/spec.md).


## Publicação instalada

Backendbridge21/metadata15,19migrationshashverificadas/fixtureSQLinstalada comrollback/zeroresíduos/ownerpreservado.8flags/digests/fontes/identidades verificados;9rotasanônimas401/no-store. Clienteupdate01a16982-acae-7fbf-bf18-f3dda38e795a, grupo0b7fe19c-9cd6-47a8-bf3b-a77b41ecfc9e, commit876295e417acb32d3ea81c2b40c468ae6c774be3; manifesto/scheme/HBC/QRoficial conferidos. CI39981649710success eCI39983257856 da conferênciafinal; QR em EXPO-PREVIEW. Ao retornar à home, metadados são revalidados sem apagar os caches; produtos recentes não são buscados novamente desnecessariamente.

## Correção T78 — apresentação monetária

“Valor indisponível” era a mensagem de falha de formatação, diferente de “Não informado” (valor ausente na fonte). O formatador compartilhado agora usa diretamente centavos inteiros e agrupamento pt-BR, sem depender de Intl.NumberFormat/formatToParts no aparelho. Não há conversão de moeda ou arredondamento. Home e telas completas de contas, investimentos e movimentações permanecem disponíveis. Regressões simulam Intl ausente, incompleto e lançando erro; dados reais não foram consultados no diagnóstico. A confirmação no iPhone permanece necessária.
