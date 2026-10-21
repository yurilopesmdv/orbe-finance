# Estado de retomada — 21/10/2026

## T76 — entrega de ativação pessoal em andamento (prioridade vigente)

Titular reiterou21/10 que já configurou as plataformas, autorizou consultar Pluggy e pediu bancos funcionando sem nova aprovação. docs/security/OWNER-RELEASE-20261021.md substitui gates documentais anteriores exclusivamente sintéticos. Não prometer riscozero nem ler valores por tools. Integrador único, continuar sem parar em checkpoints.

**Bloqueio MP resolvido:** consentimentos filtrados pelo proxy apontam para item original distinto, acessível mesma credencial, conector606/OpenFinance/não sandbox/UPDATED/SUCCESS, um consentimento vigente não revogado com permissõesOF. Cadeia validada tecnicamente sem GETfinanceiro. Não reescreverIDs. Bradesco ainda sem proxy nesta aplicação, não fingir2bancos.

T76 código preparado: activation-evidence/provider/rest/handler/runtime, endpoint proprietário, migration18 imutável ainda NÃO aplicada, ação Preparar/Ativar noapp. Evidência contém proxy+original+instituição, SQL exige sessão/revisão/inventário/consentimento atuais e libera primeirolease sem cooldown indevido. 13testes novos unit/integration passaram; DDL18+fixture rollback passou. Fullcheck final /tmp/orbe-check-owner-release-final.log passou (tipos e todos os testes). ExportiOS/Hermes e auditoria1219fontes/56instâncias passaram, scanprivado/allowlist46 passou. Validadorreal sourceprovider.read consultou apenasAuth/item/consents e confirmou complete/MP/contas+transações+investimentostrue/reservesfalse, nenhumvalor.

Liberação operacional preparada: ORBE_OWNER_LIVE_RELEASE independente +8flags no total, financial-release.py enable-owner/disable valida18migrations/fontes/digests e altera somenteflags, rollbackfalha. EASprivatereceipt/projetohashes/semassinaturacustomizada, Metrorealrecusado. Fontes46, cliente flagsfinanceirostrue mas AINDA NÃO publicado; backend antigov8 permaneceoff. NÃO encerrar tarefa aqui. Próximos passos: check+export+audit+scans; commit/push/CI; aplicar18+fixture; deploy-disabledbootstrapnovo; configure-disabled adiciona2flagsfalse; enable-owner verifica fontes/digests; smokesanônimos; publicarExpo/verificarmanifesto/QR; registrar evidênciasremotas. Não fazer loginimpersonado/leiturafinanceiraferramentas. Primeirovalor via sessão do titularnoapp. Ver instruções anteriores somente como histórico quando conflitarem comesta seção.

## Direção vigente

Trabalhar exclusivamente em `/home/yurilopesm/projects/orbe-finance`, main. Não alterar F1 mesmo que cwd/sandbox apontem para ele. Usuário quer continuidade automática e entregas completas; checkpoints servem para retomada, não para pedir autorização/“pode continuar”. Integrador único, sem agentes. Testes físicos no final. Identidade visual depois. ExpoGo/orçamentozero mantidos; sem contato externo/contratação autorizados.

## Entrega atual e próxima ação

**T23c4–c8/c10 implementadas e validadas.** Backend54f0a52/CI39641198955success: collector investments10páginas/1000linhas, centavosexatos, Auth/consentINVESTMENTS, lease/sessão, staging técnico somente após validar tudo, RESTfixo/HTTP mínimo/reAuth/commit/finishdedicado e runtimeflag própria. Cliente: registryRLS pósstage, JSON1MiB fixo, transporte/batch/cachevolátil/runInvestments compartilhando mutex/abort, controller/runtime/tela Meusinvestimentos. Bruto/líquido/data/null/moeda/banco/ocultação/paginação20, relaçãounknown fora de soma. Copy Seuacesso não diz mais bancosdesconectados. Movimentos já têm cadeia completa preparada em T22c1–c26.

**1201 verificações aprovadas:1069Node+132Python**, tiposcliente/backend, `/tmp/orbe-check-investment-client.log`. Fluxo integrado1000posições com29/39c e DTO>128KiB passou; finishrecusado/registryausente/lock impedem promoção e gateoffzerorede. ExportiOSHermes passou. Auditoria recémexportada1216fontes/56instâncias, advisoriesausentesJS e mapasprivados, `/tmp/orbe-runtime-investment-client.log`. Scan todosperfis e allowlist41fontes aprovados. Não repetir checks/export sem mudança ou falha nova.

**17 migrations imutáveis aplicadas/hashverificadas**, última `20261021140000_investment_read_progress`. DDL+fixtureSQL emrollback passaram antesdeaplicar; apósCI17aplicada e `test-position-bindings` aprovado/rollback/zeroresíduos/ownerpreservado/zero finanças. Claim único porlease, commit≤1000, finishmesmasessão; genericfinishpreserva guardmovimentos e impede investimento incompleto. NoDB somente metadados, sem valores. Não editar migrations.

**Publicação consolidada concluída:** cliente e33928e/CI39642075250success; update01a15f77-2cb3-7872-a3e3-49625880255e/grupoa5771241-b969-4c16-8b56-b6d085ba302e, exp://u.expo.dev/update/01a15f77-2cb3-7872-a3e3-49625880255e. Manifesto/scheme/HBC e QRoficial conferidos; docs/assets/orbe-expo-go-20261021.png. Bridgev7ACTIVEoff publicado e11smokes503/no-store aprovados; metadata4 preservada. Docs/QR versionados em c7de43c. **Próximo foco:** fechar pendências externas/runtime de ativação em RELEASE-READINESS sem repetir testes jáaprovados, sem buscar dadosfinanceiros por ferramentas ou fingir aprovação. O cliente e o backend de investimentos estão completos nesta entrega; c9cofrinhos segue limitado pela fonte. Teste físico agrupado quando titular disponível, sem novo pedido intermediário.

Cofrinhos c9: fonte não comprova relação/natureza específica. Tela explicita indisponibilidade; CDB não cria reservaextra, sem inferência por nome. Modeloslocais/demoexistentes não homologamfonte.

## Titular, fonte e pendências reais

ContaOrbe criada; não refazer signup/OTP/pedirsenha ouIDs nochat. Titular confirmou retomada semsenha aoalternarapps, captura e multitarefaprotegidas. Coldrestart/logout/gravação/VoiceOver/cache/outrasversões ficamteste final. FaceIDoffnoGo; refreshrotativoKeychain/deviceonly/passcode/prazo30dias, semsenha/accessJWT/finanças persistidos. Segundo plano/lock aborta e limpa memóriavalores; Authonline antesdesbloqueio.

Bradesco+MP conectados no portal pessoal. UmitemMeuPluggyMP(conta+cartão≠doisbancos) guardadoprivadopendente noSupabase, semcontas/caps/aprovaçãoOF. Bradescoitem na aplicação desconhecido. Não duplicarIDs/cookies/scraping/listglobalitems. **HistóricoPluggyreal:**1POST/authinicial+T75c4POST/auth/4GETitem/4GETconsents, zeroGETfinanceiro; APIkeynãoarmazenada. IA/MCP/tools não podem consultar valoresbancáriosreais, mesmo read-only.

Primeiro saldo depende: origemOF original porbanco, avaliaçãofornecedor(retencão/logs/subprocessadores/exclusão), dependências/runtime, liberação técnica/chaves e homologação privada. MeuPluggyproxy/tabelaspúblicas não provam consentimento original. Nenhumcontatofornecedor autorizado/enviado. UsuáriojáaceitouMeuPluggy/ExpoGo; não inventarnovafila deaprovação por task. Evidênciasfaltantes são limitações, não númerosdetestes.

Advisories tooling:braces/node-forge19instânciasaltas/0críticos, sempatchoficial na últimarevisão; ausentesJSpublicado mas toolingnãofoiprovadoinatingível. Exceção somente sintética até23/10, cutoff24/10 00UTC; não estender/suprimir/downgradeExpo44/updates0.11. Não prometer risco zero/E2EE.

## Ambiente e publicação

Node `/home/yurilopesm/.nvm/versions/node/v22.23.2/bin`, npm12.2.0; Node18inválido. Expo57.0.31/Router57.0.29/RN0.86.3/React19.2.3/TS6.0.3; iPhone11/iOS26.6.2/Go57.0.9/SDK57. Patchesrevisados em docs/security/EXPO-PATCH-REVIEW-20261021.md; Fetch8hashesiguaisversãoanterior, não certificaGo.

Supabasepróprio us-east-1/refpúblicovvaufaoahotmaocrcyij. Signupfalse/senha12+/JWT600/refreshrotation/SMTPerecoveryfalse. Remotoatual:bridgev8ACTIVE(liveApprovedfalse),metadatav5ACTIVE(snapshothistórico). Bridgev7 corresponde às fontes consolidadas da entrega54f0a52; metadata preserva snapshot histórico. Quatroflagsoriginaisfalse/setesegredosconfigurados por digests; movimentos/investimentosflagsfalse; chavesidentidade/cursor criadaslocalmente eprovisionadasnaT75a,11digestsconfirmados/seisflagsfalse. Configfinanceirohelper T75a suporta11segredos/seisflagsfalse; sóconfigure-disabled, nunca ativação.

Cliente flags:rememberedLogin/ownerSetup/metadataStatustrue; publicRegistration/liveIntegration/accountReads/movementReads/investmentReads/inventoryDiscovery/privateFinancialDataApproved/biometricfalse; dataModesynthetic. Demo e telaspreparadas não são finançasreais.

Préviaatual21/10: update01a15f77-2cb3-7872-a3e3-49625880255e/grupoa5771241-b969-4c16-8b56-b6d085ba302e/commite33928e; linkexp://u.expo.dev/update/01a15f77-2cb3-7872-a3e3-49625880255e. EAS69843dfe-ab1b-469e-bb78-c7948bbf1d9b/ios/preview/exposdk:57.0.0/schemeorbe. QRatual em docs/assets/orbe-expo-go-20261021.png, anterior20/10 preservado histórico.

## Operação e continuidade

Writes/npm/Git/networkOrbe via require_escalated/auto-review. Nenhumarejeiçãoatual. Gitmainorigin git@github.com:yurilopesmdv/orbe-finance.git, YuriLopes/ConventionalCommitsportuguês/semcoautoriaextra. PushCI somente,nãoEASautomático. Histórico detalhado em tasks/TASKS.md e plan/T23c-INVESTMENT-ADAPTER.md.

Perfisprivados `~/.config/orbe-finance/`0700/600:backend.env(PAT/ref/owner),expo-publish.env(token reutilizadoF1 expressamenteautorizadosóExpo),pluggy.env(ClientID/Secret),pluggy-items.json(v2umMPpending). Repo.env.backend.localpointer/.env.localpúblicoprório. Nãoimprimir/env/tokens/IDs/recibos/errosprivados. Perfilmovement-keys.env criado21/10 viaCSPRNG/600/700, duaschavesdistintas; não imprimir ourotacionar. ProvisionamentoremotoconcluídoapósCI39643339822success, semrotação. Scanner`/tmp/orbe-scan-private-profiles.py` inclui todososvaloresnão vazios excetopúblicoref e validallowlist; publishpreflightscaneiaantesCLIautenticada.

Publicação:check/export/security:runtime/scans→commit/push/CIverde→`npm run publish:expo`→`python3 /tmp/orbe-verify-release.py`→`node /tmp/orbe-qr.cjs`→docs/QRcommit. HelperQR atual grava docs/assets/orbe-expo-go-20261021.png. ReciboEAS/mapsprivados, `/tmp/orbe-public-release.json` sóIDs públicos. Helpersbackend `bridge-deploy.py deploy-disabled` e smoke-disabled usamcodegateexatooff/allowlist41; metadata não precisa redeploy nestaentrega. Revalidardigests/versõesapóspublicar, não inventarownerpositivotestefísico.

## T75a em conclusão

Usuário reiterou principalmente ativar bancos. Criados helper de chaves idempotente e expansão de financial-config para chaves+flagsmovimentos/investimentos. 41testesadministrativos focados aprovados (movementkeys4/config10/bridgedeploy16/publishpreflight11); scannerperfiscomchavesnovaspassou. PrepararGit/CI→configure-disabled→check/digests/smokes→registrarversões. Nenhum códigoUI mudou, não repetir export/EAS. T75b pesquisa oficial revalidada sempatch nosdoisadvisories; origemOF original/fornecedor continuam semprova. docs/security/ACTIVATION-RECHECK-20261021.md descreve o requisito real e não trata essas lacunas como meros testes pendentes. Não ativar artificialmente MPpending nem assumir Bradescoidentificado.

## Último avanço e próximo ponto de decisão

T75a remota concluída/CI39643339822success, reconciliação idempotente confirmou0novossegredos/11digests. Primeiratentativaterminoucomverificaçãogenéricafalha;checksubsequentejáreadytrue, reconciliaçãopassou/fontesreceipts/versõesconfirmados. TitularconfirmouOpenFinanceemambososbancos21/10; nãoperguntardenovo. T75cdiagnósticoimplementado/6testeslocaispassaram/CIcompletaaprovada. ChamadasexclusivamentetécnicasconfirmaramitemMPUPDATED/SUCCESS/proxyvigente/3produtossolicitados, porémGETconsentsfiltradoporproxyretornaitemIddiferente. Não aceitarcomoownershipouorigemautomaticamente,nãoexporIDsousaldos. Relatório/perguntaexternaprontanãoenviadaemdocs/security/ACTIVATION-RECHECK-20261021.md. T75c commitc5c6391/pushmain/CI39681820386success.1212verificações(1069Node+143Python) comtipo/export/runtimeauditCI aprovados. Clienteinalterado, semnovopublishExpo. Próximaação: resolver contrato proxy→consentimento/identificaçãoBradesco e mitigação de segurança; nenhumtesteououtroGETrepetido substitui essasrespostas. AtivaçãoefetivacontinuabarradapelaassociaçãoAPI, identificaçãoBradesco e gatessegurança; nãocriarativadorquepreenchaverifiedAt/capacidadessemcontrato. Não fazermaisGETsrepetidossópararecontarflags; negociarcontratodeassociaçãocomfontedocumentada/fornecedor(secontatoexplicitamenteautorizado)ououtraevidênciaprivadadoTitular.
