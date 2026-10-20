# Roadmap — Open Finance via Meu Pluggy

Revisão 0.6, 19/10/2026. Execução ativa, uma microtask por vez. Bradesco/Mercado Pago PF prioritários; Inter/Nubank expansão. Fonte financeira exclusiva Open Finance. [SPEC-009](../specs/009-meu-pluggy/spec.md) e [plano vigente](../plan/MEU-PLUGGY.md).

| Marco | Resultado | Tasks / saída | Estado |
|---|---|---|---|
| R0 | Specs, pesquisa e planejamento publicados | Contratos e escopo coerentes | Preparado |
| C0 | Contrato mínimo da ponte e revisão do backlog | T74 | done documental |
| C1 | Runtime, acesso, domínio e wireframes | T01/T02/T04/T05/T47–T49/T06 | Concluído para escopo sintético |
| R1 | App sintético, acesso e relatórios | T07/T08/T10–T16 parciais, T24–T33a/T57a/T58a/T59a/T60a | Em andamento; próxima T44a |
| G2 | Gate de dados reais | T63/T75–T78 | Não iniciado |
| R2 | Homologação privada dos dois bancos | T41/T42 e cobertura explícita | Não iniciado |
| R3 | Biometria no runtime compatível | T46/T65 | Condicionado |

Uma task por vez, com checkpoint, evidências e commit. Expo Go permanece sintético até validar controles. Ausência de produto no Open Finance bloqueia a cobertura correspondente; não existe alimentação financeira alternativa. Nenhuma execução periódica autônoma foi configurada.

## Estado operacional —20/10/2026

Retomado pelo usuário. Não esperar nova confirmação ao concluir task; manter spec → plan → tasks → código → validação → commit/push. App financeiro continua inventado, Auth/metadados em Supabase próprio. Função orbe-bridge versão1 publicada permanentemente desligada, somente503/no-store, sem env/Auth/DB/provedor; nenhum banco conectado. Credenciais fora do Metro, launcher Expo segregado e ambiente CLI offline.611 testes passaram até T37b2b; export iOS2.6MB/scan aprovados, função metadata-only v3 ACTIVE/negativosHTTP validados, tela privada /my-connections disponível.

T60b ligou comparação à UI com observações explicitamente inventadas. T60c1 composição conhecida por banco/classe foi concluída. T19a estados/capacidades puros concluída; próxima T44a runtime autenticado de metadata; T60c2 evolução depende de snapshots, sem fabricar histórico. Pendências: T11c SMTP/recuperação, T18b3 adapters ativos/runtime, T18c fornecedor/OF, T63/T78 dados reais, T65+ runtime privado e Face ID. Teste físico continua na validação final. Checkpoint operacional detalhado em STATE.md.

## Histórico

Pausa solicitada16/10, encerrada pela retomada expressa19/10. O checkpoint antigo indicava T24 próxima e T08 bloqueada; foi substituído pelo estado acima. Não há retomada agendada ou processo autônomo em horário determinado.

T38a consolidou prontidão sintética/613 testes e CI. T38b não passou: iPhone permanece carregando no QR; Metro responde/compila no host. T38c prepara requisito oficial de mesma conta ExpoGo/CLI com perfil segregado; estado de ufw pendente de leitura manual pelo titular. [Prontidão](../docs/RELEASE-READINESS.md).

Titular substituiu teste LAN por publicação remota T44a: Metro parado, token Expo autorizado/validado, projeto próprio associado;620 testes. Não confundir projeto associado com atualização publicada.
