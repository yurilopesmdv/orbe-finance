# Estado de retomada — 21/10/2026

## Direção vigente

Trabalhar exclusivamente em `/home/yurilopesm/projects/orbe-finance`, main. Não alterar F1 mesmo que cwd/sandbox apontem para ele. Usuário quer continuidade automática e entregas completas; checkpoints servem para retomada, não para pedir autorização/“pode continuar”. Integrador único, sem agentes. Testes físicos no final. Identidade visual depois. ExpoGo/orçamentozero mantidos; sem contato externo/contratação autorizados.

## Entrega atual e próxima ação

**T23c4–c8/c10 implementadas e validadas.** Backend54f0a52/CI39641198955success: collector investments10páginas/1000linhas, centavosexatos, Auth/consentINVESTMENTS, lease/sessão, staging técnico somente após validar tudo, RESTfixo/HTTP mínimo/reAuth/commit/finishdedicado e runtimeflag própria. Cliente: registryRLS pósstage, JSON1MiB fixo, transporte/batch/cachevolátil/runInvestments compartilhando mutex/abort, controller/runtime/tela Meusinvestimentos. Bruto/líquido/data/null/moeda/banco/ocultação/paginação20, relaçãounknown fora de soma. Copy Seuacesso não diz mais bancosdesconectados. Movimentos já têm cadeia completa preparada em T22c1–c26.

**1201 verificações aprovadas:1069Node+132Python**, tiposcliente/backend, `/tmp/orbe-check-investment-client.log`. Fluxo integrado1000posições com29/39c e DTO>128KiB passou; finishrecusado/registryausente/lock impedem promoção e gateoffzerorede. ExportiOSHermes passou. Auditoria recémexportada1216fontes/56instâncias, advisoriesausentesJS e mapasprivados, `/tmp/orbe-runtime-investment-client.log`. Scan todosperfis e allowlist41fontes aprovados. Não repetir checks/export sem mudança ou falha nova.

**17 migrations imutáveis aplicadas/hashverificadas**, última `20261021140000_investment_read_progress`. DDL+fixtureSQL emrollback passaram antesdeaplicar; apósCI17aplicada e `test-position-bindings` aprovado/rollback/zeroresíduos/ownerpreservado/zero finanças. Claim único porlease, commit≤1000, finishmesmasessão; genericfinishpreserva guardmovimentos e impede investimento incompleto. NoDB somente metadados, sem valores. Não editar migrations.

**Próxima ação concreta:** commitar/push cliente/documentação→CIverde→publicar backendoff consolidado+smoke→publicar prévia remota→verificarmanifesto/HBC/QR→atualizarEXPO-PREVIEW/STATE eGit. Não iniciarMetro/LAN/túnel/firewall. Usuáriotestadepois. Não ativar finanças para contornar gates sem evidência.

Cofrinhos c9: fonte não comprova relação/natureza específica. Tela explicita indisponibilidade; CDB não cria reservaextra, sem inferência por nome. Modeloslocais/demoexistentes não homologamfonte.

## Titular, fonte e pendências reais

ContaOrbe criada; não refazer signup/OTP/pedirsenha ouIDs nochat. Titular confirmou retomada semsenha aoalternarapps, captura e multitarefaprotegidas. Coldrestart/logout/gravação/VoiceOver/cache/outrasversões ficamteste final. FaceIDoffnoGo; refreshrotativoKeychain/deviceonly/passcode/prazo30dias, semsenha/accessJWT/finanças persistidos. Segundo plano/lock aborta e limpa memóriavalores; Authonline antesdesbloqueio.

Bradesco+MP conectados no portal pessoal. UmitemMeuPluggyMP(conta+cartão≠doisbancos) guardadoprivadopendente noSupabase, semcontas/caps/aprovaçãoOF. Bradescoitem na aplicação desconhecido. Não duplicarIDs/cookies/scraping/listglobalitems. **Uma chamadaPluggyreal total:POST/auth**, zeroGETfinanceiro; APIkeynãoarmazenada. IA/MCP/tools não podem consultar valoresbancáriosreais, mesmo read-only.

Primeiro saldo depende: origemOF original porbanco, avaliaçãofornecedor(retencão/logs/subprocessadores/exclusão), dependências/runtime, liberação técnica/chaves e homologação privada. MeuPluggyproxy/tabelaspúblicas não provam consentimento original. Nenhumcontatofornecedor autorizado/enviado. UsuáriojáaceitouMeuPluggy/ExpoGo; não inventarnovafila deaprovação por task. Evidênciasfaltantes são limitações, não númerosdetestes.

Advisories tooling:braces/node-forge19instânciasaltas/0críticos, sempatchoficial na últimarevisão; ausentesJSpublicado mas toolingnãofoiprovadoinatingível. Exceção somente sintética até23/10, cutoff24/10 00UTC; não estender/suprimir/downgradeExpo44/updates0.11. Não prometer risc zero/E2EE.

## Ambiente e publicação

Node `/home/yurilopesm/.nvm/versions/node/v22.23.2/bin`, npm12.2.0; Node18inválido. Expo57.0.31/Router57.0.29/RN0.86.3/React19.2.3/TS6.0.3; iPhone11/iOS26.6.2/Go57.0.9/SDK57. Patchesrevisados em docs/security/EXPO-PATCH-REVIEW-20261021.md; Fetch8hashesiguaisversãoanterior, não certificaGo.

Supabasepróprio us-east-1/refpúblicovvaufaoahotmaocrcyij. Signupfalse/senha12+/JWT600/refreshrotation/SMTPerecoveryfalse. Remotoantesdestaentrega:bridgev6ACTIVE(liveApprovedfalse),metadatav4ACTIVE(snapshothistórico). Backendlocalagoramaisnovo, nãoclaimar igualdade. Quatroflagsoriginaisfalse/setesegredosconfigurados por digests; movimentos/investimentosflagsausentes/off e chavesidentidade/cursor ainda não geradas/provisionadas. Configfinanceirohelperantigo sósetesegredos/quatroflags; não usarparaativar.

Cliente flags:rememberedLogin/ownerSetup/metadataStatustrue; publicRegistration/liveIntegration/accountReads/movementReads/investmentReads/inventoryDiscovery/privateFinancialDataApproved/biometricfalse; dataModesynthetic. Demo e telaspreparadas não são finançasreais.

Últimapréviapublicada20/10c38: update01a15bbf-7194-7ce1-8903-b8ca5ff4e0e3/grupo1dbf421d-740d-47d5-aff6-8858a3b7732e/commitad2dcc3; linkexp://u.expo.dev/update/01a15bbf-7194-7ce1-8903-b8ca5ff4e0e3. EAS69843dfe-ab1b-469e-bb78-c7948bbf1d9b/ios/preview/exposdk:57.0.0/schemeorbe. NovoQR após publicação, não usarQRantigocomosendo novo.

## Operação e continuidade

Writes/npm/Git/networkOrbe via require_escalated/auto-review. Nenhumarejeiçãoatual. Gitmainorigin git@github.com:yurilopesmdv/orbe-finance.git, YuriLopes/ConventionalCommitsportuguês/semcoautoriaextra. PushCI somente,nãoEASautomático. Histórico detalhado em tasks/TASKS.md e plan/T23c-INVESTMENT-ADAPTER.md.

Perfisprivados `~/.config/orbe-finance/`0700/600:backend.env(PAT/ref/owner),expo-publish.env(token reutilizadoF1 expressamenteautorizadosóExpo),pluggy.env(ClientID/Secret),pluggy-items.json(v2umMPpending). Repo.env.backend.localpointer/.env.localpúblicoprório. Nãoimprimir/env/tokens/IDs/recibos/errosprivados. Nenhumperfilmovement-keys.env criado. Scanner`/tmp/orbe-scan-private-profiles.py` inclui todososvaloresnão vazios excetopúblicoref e validallowlist; publishpreflightscaneiaantesCLIautenticada.

Publicação:check/export/security:runtime/scans→commit/push/CIverde→`npm run publish:expo`→`python3 /tmp/orbe-verify-release.py`→`node /tmp/orbe-qr.cjs`→docs/QRcommit. HelperQR grava docs/assets/orbe-expo-go-20261020.png; preferirrenomearpara20261021antesnovapublicação. ReciboEAS/mapsprivados, `/tmp/orbe-public-release.json` sóIDs públicos. Helpersbackend `bridge-deploy.py deploy-disabled` e smoke-disabled usamcodegateexatooff/allowlist41; metadata não precisa redeploy nestaentrega. Revalidardigests/versõesapóspublicar, não inventarownerpositivotestefísico.
