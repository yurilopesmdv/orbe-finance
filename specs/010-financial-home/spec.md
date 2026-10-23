# SPEC-010 — Home financeira e sincronização automática

23/10/2026. Solicitação expressa do titular: home com saldos de todas conexões, investimentos/cofrinhos, movimentos recentes e acesso ao histórico; sincronização automática, sem navegar entre telas para consultar cada produto. Segurança preservada, sem novos fornecedores, cobrança ou persistência financeira em claro.

## Evidência

Leitura de saldos confirmada pelo titular. Diagnóstico técnico posterior confirmou movimento iniciado e finalizado com sucesso, mas os controllers eram criados/fechados pelo foco de cada rota. Os dados desapareciam ao navegar. Intervalo900s por conexão também bloqueava produtos diferentes.

## Requisitos

- HOME-01: account passa a ser home privada real após login; totais por moeda, saldos de todas conexões, investimentos e reservas explícitos, cinco movimentos mais recentes dos últimos dois meses e atalhos para detalhes. Demo separada e sinalizada.
- HOME-02: sessão financeira única no nível da aplicação; navegação não apaga dados. Lock/logout/segundoplano/proteção indisponível aborta requisições e purga toda memória financeira. Sem snapshots em disco/logs/Git. Ao retomar, sincronização automática autenticada.
- SYNC-01: atualizar automaticamente ao desbloquear e a cada15min em primeiro plano; um job por vez, bancos/produtos sequenciais, resultado parcial preserva snapshots válidos anteriores. Nenhum polling desativado/bloqueado.
- SYNC-02: cooldown específico por conexão/produto30s; uma única lease ativa120s por banco preservada. Backend confere owner/revisão/capacidade/consentimento/produto; cliente antigo continua protocolo e intervalo900s. Retry automático limitado ao ciclo/intervalo; não limpar falhas/limites por SQL administrativo.
- SYNC-03: novos pedidos de lease informam accounts/transactions/investments, nenhuma credencial/ID externo. Vincular produto à lease impede usar lease de contas para movimentos. Migration19 antes do backend/cliente.
- MONEY-01: centavos seguros e moedas separadas. Mostrar subtotal de contas e subtotal de investimentos, sem somar investimento potencialmente incluído no saldo. Total patrimonial conciliado só com relação distinta comprovada; parcela desconhecida explícita. Cofrinhos não inferidos por nome nem somados duas vezes; sem prova mostrar indisponibilidade.
- UX-01: progresso por produto/banco, atualização local e falhas claras; zero só após consulta válida sem itens, ausência/falha não virazero. Dados ocultos inicialmente, mostrar/ocultar central. Histórico utiliza o mesmo cache, atualização específica só pela fila comum.

## Validação

SQL/RLS: cooldown mesmo produto, produtos sequenciais sem espera900s, lease concorrente bloqueada, produto errado recusado, owner/revisão/consentimento/capacidade, protocolo antigo preservado. Hub: carga automática/ordem/retenção entre navegação/falhas/lock/purge/timer e totais sem duplicar. Tipos/check/exportiOS/audit/scans/CI. Instalado e QR remoto verificado. Nenhum valor real por ferramentas; aceite de cobertura só pelo titular.

- RECENT-01: sincronizar mês atual e anterior para a home, mantendo cada mês no cache; intervalo porproduto pode adiar o segundo período por30s, com nova tentativa automática. Ver todas abre o mês do movimento mais recente exibido. Não declarar histórico completo.
