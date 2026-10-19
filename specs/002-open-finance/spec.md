# SPEC-002 — Conexões e sincronização

**Revisão vigente 0.4:** [SPEC-009](../../specs/009-meu-pluggy/spec.md) seleciona Meu Pluggy para integração automática Bradesco/Mercado Pago PF. [Plano vigente](../../plan/MEU-PLUGGY.md). Esta revisão prevalece sobre escolhas conflitantes abaixo; Open Finance é a única origem financeira admitida. Pesquisa pública permite seguir no planejamento, sem aprovação de dados reais.


Estado: ready para R1 sintética; dados reais continuam bloqueados. Depende de SPEC-000/001. Proposta inicial: adaptador Pluggy com caminho pessoal MeuPluggy; depende de homologação. Evidências e limites em [pesquisa](../../docs/research/FEASIBILITY.md).

| ID | Requisito |
|---|---|
| OF-01 | DEVE permitir vincular Mercado Pago e Bradesco PF ao proprietário, com Inter/Nubank em expansão e exibir capacidades reais por produto |
| OF-02 | DEVE manter segredos de agregador e credenciais privilegiadas somente no backend; app recebe apenas sessão própria e tokens restritos quando aplicáveis |
| OF-03 | DEVE registrar autorização/estado conhecido, origem da conexão, recursos permitidos, expiração quando informada e caminhos de renovação/revogação |
| OF-04 | DEVE distinguir atualização bancária automática no fornecedor, independente do app, de consulta autenticada pela ponte e promoção no cache local; esta última ocorre com app desbloqueado, sem prometer atualização local em background |
| OF-05 | DEVE suportar paginação, deduplicação por IDs de origem, atualizações, exclusões/cancelamentos declarados e repetição de consultas/lotes |
| OF-06 | DEVE conservar último lote válido por produto em falha, sinalizar parcialidade e nunca substituir saldo desconhecido por zero |
| OF-07 | DEVE validar eventos e vínculo de proprietário sem confiar no itemId enviado pelo cliente ou no sucesso de um callback |
| OF-08 | DEVE interromper novas coletas em pausa/revogação/exclusão; retomada exige situação válida da conexão |
| OF-09 | DEVE respeitar capacidades e limites do modo pessoal, separando reimportar dados disponíveis de forçar atualização no banco |

## Jornada inicial gratuita proposta

1. Proprietário autoriza cada banco no portal Meu Pluggy e vincula os itens por aplicação demo do Dashboard, conforme guia oficial.
2. Os IDs são cadastrados operacionalmente pelo backend para o proprietário após validar acesso com a credencial do projeto. O cadastro não será um campo público para colar UUID de item arbitrário.
3. O Orbe oferece Conexões com guia/status e leitura consolidada. A autorização acontece fora do Orbe nesta modalidade; onboarding integral dentro do app é outra opção de produto, não promessa do MVP.
4. Retorno do navegador ao Expo Go é manual no caminho inicial; ao retomar, exige login e atualiza o estado no backend. Deep link bancário não é requisito para o caminho gratuito.

Não adotar conectores diretos que solicitem credenciais bancárias como fallback automático para ausência de Open Finance. Confirmar no setup qual trilha o portal usa por banco; se não atender à exigência de Open Finance, registrar desvio e não declarar essa instituição homologada. O conector proxy MeuPluggy é classificado como Direct pelo fornecedor; isso não prova que a conexão original com cada banco usou Open Finance. Manter essa distinção na evidência.

## Estados e política de atualização

Conexão: not_linked → awaiting_authorization → active; alternativamente partial, needs_reauthorization, paused, revoked, error ou unsupported. Expiração desconhecida fica desconhecida, não recebe data inventada. Sync: queued → running → succeeded/partial/failed/cancelled, com contagem por produto e erro sanitizado.

O botão será “Buscar dados disponíveis”, com explicação da cadência; não “Atualizar banco agora”. A consulta é limitada no servidor e o lote é deduplicado no aparelho, limitada inicialmente a uma solicitação por conexão a cada 15 minutos, com uma execução concorrente por conexão. Reconciliação ao abrir/retomar consulta itens já conhecidos, não depende de listagem global. Cadência e quotas serão confirmadas no spike; nenhuma rotina que force PATCH de item proxy será planejada.

Webhooks e cron de coleta ficam desligados nesta primeira versão: não há armazenamento financeiro no servidor nem necessidade de receber eventos para consultar ao abrir o app. T34 registra a decisão; T35 deferred. Alterar isso requer revisão de spec, retenção e autenticação de eventos antes de código.

## Aceite

- AC-O01: dois bancos prioritários têm entrada na matriz; expansão identificada, com capacidades e limitações observadas; sem acesso real o estado é não homologado.
- AC-O02: repetir lote, página ou evento não duplica transação/posição; evento fora de ordem não regride dado novo.
- AC-O03: fonte retorna timeout/429 na página 2: lote não promove página 1 como completo nem zera dados anteriores; retry é limitado.
- AC-O04: falha de investimentos não apaga sucesso de contas; visão informa produto pendente e datas diferentes.
- AC-O05: item de outro proprietário ou webhook forjado não cria vínculo nem dispara coleta ilimitada.
- AC-O06: revogar enquanto um job está em execução impede promoção de dados posteriores à revogação; evento atrasado não recria conexão.
- AC-O07: app fechado não recebe lote local incompleto como concluído; atualização bancária continua no fornecedor e reabertura autenticada refaz consulta/promove lote completo.
- AC-O08: rotina pessoal não chama listagem global indisponível nem atualização manual proibida; botão informa o que fez.

## Metadados T13

Persistir somente relações internas/conexão/conta, instituição enumerada, estado/capacidades nullable, moeda e datas. Tabelas públicas de metadados têm RLS select apenas se auth.uid é o proprietário permitido e coincide com owner_id da linha; sem DML pelo cliente. Identificadores externos ficam em tabelas privadas, sem USAGE para anon/authenticated. Segredos não vão para essas tabelas.

FKs compostas impõem conexão/conta/dono consistentes inclusive para writes administrativos. Item externo único na aplicação pessoal; conta externa única por conexão. Cadastro pending não comprova Open Finance; estado active exige data de verificação original, inserida somente pela administração/backend. Campos de capacidade null = desconhecida, false = indisponível confirmado. Sem coluna de saldo/movimento/posição/payload/descrição/CPF/número de conta. T20 adicionará leases/cooldown; nenhum acesso bancário nesta task.

## OF-10 — Guia inicial sem conexão (T33a)

Ajustes DEVE dar acesso a uma tela secundária Conexões sem alterar as quatro abas. Na fatia sintética, Bradesco/Mercado Pago PF aparecem não conectados e produtos não homologados; não representar capacidades desconhecidas como saldo zero, indisponibilidade confirmada ou conexão ativa. Inter/Nubank ficam como expansão. Explicar Meu Pluggy/Open Finance, atualização da fonte versus leitura do app, e distinção entre pausa/desvínculo/revogação sem oferecer operação real. Sem abrir banco/widget/link externo, coletar itemId/CPF/credencial ou iniciar consulta. Acesso Orbe por senha deve ser diferenciado de senha bancária e do modo demonstração; informar Face ID não habilitado sem declarar login implementado como ausente.
