# Estado de retomada —19/10/2026

Execução ativa, retomada pelo usuário, inclusive novo “pode continuar”. Continuar automaticamente uma microtask por vez: spec → plan → tasks → código → validação → commit/push, sem esperar nova confirmação. Repositório /home/yurilopesm/projects/orbe-finance, main. T20b2 concluída: coordenação de lotes metadata-only, guards de sessão/commit e descarte de staging,381 testes e export iOS aprovados. T21a concluída: normalizador interno mínimo de contas, vínculo explícito e projeção sem PII;396 testes/typechecks aprovados. T21b concluída: staging por execução integrado em fixtures ao coordenador e MemoryAssets;412 testes/typechecks. T22a concluída: DTO interno mínimo de movimentos com transferências comprovadas/estornos e contexto por conta/mês;432 testes/typechecks aprovados. T22b1 concluída: MemoryLedger.promoteBatches valida todas contas do mesmo source/mês antes de único swap,443 testes/typechecks. T22b2 concluída: manifesto de contas, cursores global/conta distintos e publicação atômica pelo ledger;461 testes/typechecks. Comprovação de transferência é par conta/movimento, sem ampliar outra conta por colisão. T23a concluída: DTO interno de posições/reservas com bruto/líquido/base/classe e relações explícitas,476 testes/typechecks. T23b1 concluída: cache MemoryAssets conserva valuation completo/validado,483 testes/typechecks. Próxima T23b2 staging de posições/reservas, mantendo bruto/líquido/base/classe. Sem fonte financeira real; gates preservados.

## Produto, limites e gate

Orbe pessoal, iPhone11/iOS26.6.2/ExpoGo57.0.9/SDK57, Node22.23.2/npm12.2.0. Open Finance exclusivamente Meu Pluggy, Bradesco/Mercado Pago PF prioritários, Inter/Nubank expansão. Sem import manual. Não prometer zero vazamento/E2EE: fornecedor/ponte veem conteúdo durante processamento. Nenhum consentimento/banco real, valor financeiro real, cron/webhook ou recurso pago. liveIntegrationEnabled/biometricLoginEnabled continuam false. Expo Go financeiro somente sintético; dados reais exigem T63/T78/OF/runtime T65+. Teste físico permanece ao final por ordem do usuário.

## Implementado e publicado

- T74/T01–T09 e pesquisa/gates iniciais: contrato, runtime SDK57, spikes/fixtures, bootstrap/CI; auditoria mantém limitações abaixo.
- T24/T25/T26/T26b: reconciliação sem duplicar reserva, null/overlap parcial, classificação por campo override>regra>provedor e dinheiro/datas/formatter exato BigInt.
- T27a/T28/T29a/T30a/T31a: quatro abas/resumo/movimentos/carteira sintéticos, filtros/paginação/totais fonte/data, correções voláteis e privacidade compartilhada. Subtasks privadas b pendentes.
- T57a/T58a/T59a: relatórios locais/drill-down com conta/tipo/categoria/mês, resumo visível e scopeCategory para recomputar parcialidade pai; rotas só opções inventadas conhecidas.
- T60a/b: comparação mensal pura e UI, fontes/cobertura/data explícitas, percentual somente fechado/completo/basepositiva, sem histórico inventado; setembro0 explícito, agostomissing, outubroparcial19/10. Percentual/explicação ocultos junto dos valores.
- T60c1: composição por banco/classe de countedIds, BigInt/maioresrestos shares10000 e totais fechados, sem duplicar reserva/meta/limite. T60c2 evolução falta snapshots, não fabricar.
- T16a/T32a: metas/alocações voláteis com orçamento explícito não reservado, formulário/seed/reset e título oculto; sem transferência/persistência privada.
- T14a/T15a: MemoryLedger/MemoryAssets com MemoryScope(principal/geração), tickets opacos e promoção completa; MemoryScope não é observador Auth, controller futuro deve close no lock. Cache financeiro real/nativo não implementado.
- T08/T10/T11a/b/T12a: Supabase próprio criado pelo titular, owner provisionado por UUID privado, login/logout REST e sessão volátil; AppState bloqueia/aborta/limpa campos. Senha/email do titular nunca consultados nas ferramentas. T11c recovery bloqueada por SMTP; login positivo/físico pendentes.
- T13: metadados conexões/contas sob RLS e vínculos externos privados, sem valores financeiros.
- T51a: referências escalares runtime não promovem payloads inesperados; T51b SSRF/provedor completo pendente.
- T50a/b: credenciais fora Metro, dotenv excluído do grafo(crawler real/canários); launcher start/export com allowlist, perfil exclusivo/offline/sem telemetria, sem herdar tokens. Nunca executar CLI Expo diretamente/túnel.
- T18a/b1/b2: core/RESTAuth+RPC+metadata testados localmente, token explícito por request sem lastToken; entrypoint orbe-bridge v1 ACTIVE publicado **literal enabledfalse**, sempre503/no-store sem env/Auth/DB/Pluggy. verify_jwtfalse serve somente essa indisponibilidade, não endpoint financeiro público. Deno local ausente; hostmock não é Deno, HTTP real validou só desligado. T18b3 adapter ativo/end-to-end e T18c fornecedor pendentes.
- T33a: Ajustes→Conexões, bancos desconectados/guia sem rede e mensagens de login corrigidas.
- T19a: normalizador DTO puro, gates desligados sem tocar raw/clock, estados/capacidades/expiração/projeção; não verifica Auth/owner nem integra supplier. T19b1 prazos proxy/banco concluída; T19b2 fornecedor/OF pendente.
- **T20a**: lease privado120s/cooldown900s, RPC begin/check/finish só service_role, tabela ACL negada inclusive service, trigger revisão para state/capability/OF/auth/owner. Paginação revalida produto true/owner/revision/nonce/TTL. Sem adapter ativo ou chamada bancária.

## Backend e segredos

Projeto próprio Orbe saudável(us-east-1),6tabelas app metadata/Auth,5migrations imutáveis: 20261016170000_bootstrap,20261019180000_owner_access,20261019200000_connection_metadata,20261019210000_read_leases,20261019220000_split_consents. Não editar aplicadas. ManagementAPI atribui versão remota diferente; nome orbe_<stem>_<sha256>, helper verifica hashes. Não usar CLI dbpush remoto.

~/.config/orbe-finance/backend.env(0600/diretório0700) guarda PAT/ref/ownerUUID; .env.backend.local ignorado contém só ORBE_BACKEND_ENV_FILE para destino fixo. Nunca imprimir valores. .env.local somente publicURL/publishable/recoveryfalse. Perfil Expo exclusivo ~/.config/orbe-finance/expo-cli; CLI offline não bloqueia login HTTP do app. Metro permanece parado, sem LAN/túnel/teste físico novo.

scripts/backend-admin.py: inspect/migrate/set-owner/test-owner/test-metadata/test-read-leases/configure-client, sem SQL arbitrário. Bridge deploy helper confirma projeto/fontes/entrypointfalse, recusa função alheia; log/manifest privados em ~/.config/orbe-finance/bridge-deploy.log/json. ALLOWED functions atualmente5files: _shared/bridge.ts,_shared/supabase-rest.ts,_shared/http-json.ts,_shared/lease-rest.ts,orbe-bridge/index.mjs; nova fonte compartilhada exige atualizar allowlist/testes antes de redeploy. Não redeploy só por sourcefixture novo; endpoint continuaoff.

Docker Orbe parado: launcher anterior detectou Mailpit wildcard54344 e parou somente Orbe, sem apagar volumes. Não reabrir diagnóstico/tocar outros containers/firewall.

## Validação e bloqueios

TypeScript cliente/ponte e **483 testes locais** passaram até T23b1. Export Hermes iOS2.5MB T20b2 aprovado; PAT/UUID ausentes. Doctor21/21 e dependências SDK validados T07, sem novos packages desde então. SQL real: owner/metadata/read-leases passaram com papéis reais e rollback, zero2identidades fake por cenário e owner real preservado. Teste lease é sequencial, não multissessão; FORUPDATE usa semântica PG. Smoke Auth antigo fakeuser HTTP negado/destruído; sem senha do titular. Runtimeoff3HTTP503 passou. CI6b90662 aprovada: https://github.com/yurilopesmdv/orbe-finance/actions/runs/39289486505; não declarar HEADCI aprovada sem conferir.

Auditoria18high em2raízes sem patch, exceção somente sintética até23/10(cutoff24/10UTC);10moderados corrigidos por overrides. Não auditfixforce nem liberar dados reais. CI sem secrets/testes sintéticos/audit/export; SQL/smokes remotos opt-in.

SMTPFree/default recusou template OTP HTTP400; recoveryflagfalse/sem envioemail. T11c exige SMTP revisado e entrega comprovada; não contratar/upgrade. configure-client hoje habilitaria em PATCHsuccess: antes deSMTP futuro acrescentar gate explícito de entrega. Isso não bloqueia tarefas independentes.

## Próximos passos

1. T23b2: spec/plan antes de ligar normalizador de posições ao estágio e MemoryAssets. Considerar extrair engine comum de account-staging para não duplicar cancelamento/ordem/limites/guards; só factories com normalizadores concretos confiáveis, nunca callback de payload. Testes anteriores de contas devem continuar passando e novos de posição conservar valuation/ciclos/ausências. Sem atomicidade global entre produtos.
2. T18b3/T18c/T19b2/T21–T23: adapters/source/OF/gates. Não mapear status empresarial para proxy pessoal sem comprovar contrato. Nenhum banco real aprovado.
3. T14b–T17/T29b–T33b dependem runtime privado/segurança; T65+ decidir FaceID/cache/SDK além de ExpoGo. Não tratar devbuild como prova de segurança.
4. T60c2 só evolução de snapshots existentes. T11c recuperação depende SMTP. Testes físicos/VoiceOver/loginpositivo ficam finais por ordem do usuário.

Git Yuri Lopes, Conventional Commits português/main/push autorizados. .git reparado19/10(noveobjetos vazios) com mirror/hashes/fsck, sem reset; backups /tmp/orbe-git-backup-20261019 e /tmp/orbe-git-recovery-20261019.git. Não repetir reparo sem evidência.

T19b1: schema proxy_consent_expires_at/bank_consent_expires_at, antigo authorization_expires_at foi renomeado com tabela vazia; helper/trigger/mapeamento DTO atualizados, alias authorizationExpiresAt só derivado. Guia pessoal tem proxy anual que pode produzir vazio com status velho; checar prazos antes de coleções/renovação não assumeitemID. Plano T19b1 e BANK-COVERAGE descrevem evidências. SEC05/T51b pendente: API exige opaqueIDs upstreamURL; fechar ADR/logretention antes de implementar fornecedor, sem exceção automática. Site público referenciaGTM, fluxo autenticado não auditado. Não acessar conta/banco real nas ferramentas.
