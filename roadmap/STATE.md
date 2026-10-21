# Estado de retomada —20/10/2026

Repo `/home/yurilopesm/projects/orbe-finance`, main, independente do F1. Usuário pediu continuidade automática sem pedir aprovação/“pode continuar”, uma microtask de cada vez com checkpoint: spec→plan→tasks→implement→validate→commit/push. Integrador único, sem subagentes. Orçamento zero/iPhone11/iOS26.6.2/ExpoGo57.0.9/SDK57; identidade visual depois. Não acessar dados financeiros reais por IA/MCP/ferramentas. Nenhum serviço pago ou mensagem a terceiros autorizado.

## Ação imediata

**c21–c42 e T22c1–c5 concluídas**,1014 testes/typechecks e CI39587278861success. Bridgev6ACTIVE publicadooff, metadata4preservado;7smokes503/no-store e5negativosAuth aprovados, financialReads/providerCalls0. Cliente/QRc38inalterado. Próxima **T22c6** spec/plan/tasks/implement de cursorAEAD backend (manifesto1–100contas, sessão/owner/connection/revisão/lease/mês/expiração<=120s emAAD), token<=512 semrawquery legível; rejeitar cursorgrande emvez de truncar e não prometer usoúnico global. Nenhuma chave real configurada/rotaativada. Depois transporte/lease/multiwindow. Userquer avançarhojesemtestes/aprovaçõesintermediárias; gatesreaisfornecedor/OF/runtime permanecem.

Não parar após cada task ou pedir teste intermediário. Não repetir instruções de conexão/IDs ao titular. Perguntas antigas já respondidas. Há trabalho técnico independente; fornecedor/OF/retenção e homologação não podem ser inventados.

## Situação bancária confirmada

Titular conectou Bradesco e MercadoPago no portal pessoal, depois MeuPluggy na aplicação demo de desenvolvimento. Capturas mostram2bancos na origem e detalhe de1item na demo com produtosMP (conta+cartão; “Contas2” não significa2bancos). URL enviada seleciona itemId, não prova listagem completa. Não presumir um item por banco nem que1item agrega todos. ItemMP fornecido foi salvo apenas no perfil privado e cadastrado noSupabase como **pending**, confirmado por booleano:1MPpending, semOF/capacidades, nenhuma conta real registrada. Bradesco na aplicação ainda não identificado. Não copiar URL/ID/screenshot paraGit/logs nem pedir IDs decontas.

`~/.config/orbe-finance/pluggy.env` tem ClientID/Secret com formato/permissões válidos, autenticados remotamente somente em POST/auth na c34; APIkey extra nãoénecessária. `pluggy-items.json` versão2 lista1a5itens, instituição bradesco/mercado-pago/unknown,1configurado/identificadoMP. `provider-items.py init/check` offline/redigido, migra sótemplatelegadovazio. `stage-provider-items.py check/stage` obtém backendsecret sómemória via GETliteralapi-keys?reveal=true, verifica projetohashes e chamaRPCpending porbody, nuncaPluggy. CadastroMPjáfeito, não repetirnecessariamente. **Uma chamada técnica POST/auth validada, zero leituras financeiras pelas ferramentas**.

## Código entregue e pendências de execução

Cliente Expo57.0.30/RN0.86.3/React19.2.3/TS6.0.3. Node22.23.2/npm12.2.0 em `/home/yurilopesm/.nvm/versions/node/v22.23.2/bin`; nãoNode18. Crypto/ScreenCapture/SecureStore57.0.4 incluídosGo.

Login lembrado guarda refreshrotativo noKeychain/passcode/deviceonly/origem/prazo30dias; nunca senha/accessJWT/finanças. RevalidaAuthowner/orbe_has_session antesunlock; lock/background cancelam/purgam, logoutrevoke/clear, requirePassword mantémrecênciaRLS. Titular confirmou criação deconta, retomada semsenha aoalternar e proteção de captura/multitarefa. Não inferircoldrestart/logout/gravação/VoiceOver/nativecache/30dias/outrasversões; roteirofinaldepois. FaceIDoff/ExpoGoiOSnão suporta; nãoexigirbuildpago.

Runtime cliente rememberedLoginEnabledtrue; accountReadsEnabled/liveIntegrationEnabled/privateFinancialDataApproved/biometricLoginEnabledfalse; dadossintéticos. Minhascontasoff não instancia portas/cache/UUID/rede. Futuroready exige sessão+screenreadyactive, UUIDcryptolocal, registryRLSinterno, scopeaccounts-only e cachevolátil/valoresocultos. Demo de gastos/relatórios/investimentos/cofrinhos não comprova integraçãoreal.

Backendpreparado de leitura: Auth→owner/revisão/lease→bindingprivado→PluggyAuthchaveclosure119min→GETitemconsentatual→GETaccounts→decoderexato/BigInt/DTOsemPII→reAuth/release→finalize→cliente. CREDITnãoé saldo/limite; bindings técnicosCREDIT existem só para validar antes da exclusãofinanceira. BRL/USD/EUR2casas; null/unknown/coveragefalse/data nãoinferida.

Descoberta prepared: Authowner→resolvepending→leaseglobal→check→AuthPluggy/itemconsent/accounts→projeção somenteIDs/moeda→reAuth/reResolve/check→commitSQLatômico. Não lê balance/name/number/owner/creditData na projeção, retorna aoHTTP somentecontagem. Conexãopermanecepending/semOF/capacidades. Deadline120s/globallease120s/cooldown900s; cancelamento/perdaresposta apóscommit pode deixar metadatapendingidempotente, não prometer rollback distribuído. Handler1inflight/close/Bearer/bodyinterno16KiB/no-store. Rede literal própria/PluggyAuthitemaccounts, cookies/headerscruzados/redirect/outroshosts recusados;128KiB sóstage/commit.

`account-configuration.ts` centraliza gates/host/chaves/probeantessegredos. `account-runtime.ts` e `inventory-runtime.ts` suportam modos explícitos fixture/live desdec29, com aprovação independente. Composição alta exige codegate+flags; entrypoint financeiro publicado permanece liveApprovedfalse. Não usar fixturetrue emprodução. Segredos deprov configurados na cloud exclusivamentecomflagsfalse emc36, nenhuma chamada financeira real.

## Supabase e segurança

Projeto próprio refvvaufaoahotmaocrcyij/us-east-1. **12 migrations imutáveis/hashverificadas**, última20261020190000_pending_inventory_leases. SQLowner/sessão/RLS/lease/pausa/remoção/binding/staging/inventário/nonce/cooldown/atomicidade com identidadesfictícias+rollback passaram; zeroresíduos e ownerpreservado. Sem tabelas devaloresfinanceiros. Appownerglobalfixo/signupsfalse;JWT600/refreshrotation/pw12. SMTP/recoveryfalse; não regenerarOTP/enviar e-mail.

**orbe-bridge v6ACTIVE/liveApprovedfalse503**, metadata v4ACTIVE/Authowner/session/RLSsomente. Smoke ponte3off/metadados5negativos passaram. Reciboantigov1 reconciliadoparahash/version3 por downloaddereadonly, semmudançaremota. Allowlistbridge-deploy.py26files/entryexatoliveApprovedfalse/scancanários privadosPATownerExpoPluggyIDs; não redeploy porfixture. ProbeEdge comprovou decoder9007199254740993/0.29 e foi removido, semprovedor.

Reais ainda nãoaprovados: origemOFporbanco, revisãofornecedor/subprocessadores/logs/retencão/exclusão, dependências e runtimeprivado/homologação. Não garantir vazamentozero/E2EE nem tratarausênciadenotícias comoaprovação. Audit19altos/0críticos/2raízes braces/node-forge sempatch na últimarevisão; exceção sósynthetic até23/10(cutoff24UTC), nãoestender ouaplicar downgradeExpo44/updates0.11. JSexportatual1205fontes56instâncias semraízes não certifica toolchain/nativo/EAS/fornecedor. docs/security/ACTIVATION-BLOCKERS-20261020.md temquestõesexternas nãoenviadas. Não contatarfornecedor seminstrução.

## Publicação, segredos e continuidade

ÚltimoExpo update01a15bbf-7194-7ce1-8903-b8ca5ff4e0e3/grupo1dbf421d-740d-47d5-aff6-8858a3b7732e/commitad2dcc3, iospreview/runtimeexposdk57.0.0/schemeorbe. QR docs/assets/orbe-expo-go-20261020.png e docs/EXPO-PREVIEW.md; link exp://u.expo.dev/update/01a15bbf-7194-7ce1-8903-b8ca5ff4e0e3. Manifesto/hashHBC/linkQRconferidos, recibosprivados. Backend-only nãoexigeQRnovo.

SandboxcwdF1; writesOrbe/Git/npm/network usam require_escalated/auto-review. GitYuriLopes/ConventionalCommitsemportuguês/main/pushautorizado, sem mençãoaagente. PushOrbeexecutaCI, nãoEASautomático. Usar check→exportiOS/runtimeauditquandoafetarcliente→scan→Git/CI→publishwrapper→manifest/hash/QR→docs. Não usarMetro/LAN/túnel/firewall; Metro/DockerOrbeparados, não mexeroutrosprojetos.

`~/.config/orbe-finance/backend.env`0600/dir0700: PAT/ref/ownerUUID; `.env.backend.local` sópointer. `.env.local` sóSupabaseURL/publishable/recoveryfalse. ExpoTokenF1reutilizado porautorização explícita só emexpo-publish.envprivado; nenhumF1Supabase. EASprojeto69843dfe-ab1b-469e-bb78-c7948bbf1d9b/yurilopesmdv/orbe-finance, CLI25.2.0cachedignore-scripts. Helpersprivados: /tmp/orbe-scan-current.py, orbe-verify-release.py, orbe-qr.cjs. ScanIDs doinventário também antes doGit, semimprimirvalores. Não catprofiles/recibos/brutos/sourcemapsprivados. ReparoGit19/10feito, nãorepetirreset.

c29/MPG-44/ADR-016 concluída: móduloslowlevel têm ExecutionPolicyfixture/live, compatibilidadefixtureOnly sótests, liveexigeprivateDataApprovedtrue, conflitosfalhamfechado. Capturamodo emfactory e regressões921aprovadas; nenhum boot/entrypoint/flagreal alterado. Próxima c30 atualizarfactorysdeboot para execução explícita sob liveApproved(código)+3flags, fronteira de rede e defaultfetchsomenteapós gates; entrypointpublicado segueoff.

c30/MPG-45 concluída: boots altos suportam mode explícito/liveApprovedcódigo+3flags; fixturesemfetchfallback e livecomredeguardada.926testes/typechecks aprovados, incluindo pontaapontalive com rede fictícia. Nenhum entrypoint/flag/envremote alterado. Próxima c31 unifiedruntime guardadoporfalse/allowlist atualizada/canariessupplierIDs antes de publicação exclusivamente503; depois cliente sobgates e revisão deativação.

c31/MPG-46 concluída: financial-runtime rootunificado com defaultcodeoff/flags, entrypointliveApprovedfalse exato.934testes/typechecks; bridgev4publicado/7rotas503/no-store/nenhumprovedor ouvalorreais. Canários de perfisprivados impedem segredo/ID no pacote. Próxima c32 gatewaycliente de descoberta, readiness e UI sobflagsfalse, sem pedir novaautorização/IDs e sem liberarfinanceiro. Revisar docsatuaisqueaindacitamv3 comoestadoativo (históricov3preservado).

c32/MPG-47 concluída: gatewayclient da descoberta sobgates, endpointliteral ownproject, bodyinterno ewhitelistcontagem; timeout120s/bound4096 sódiscover, operaçõesanteriores20s.943testes/typechecks/exportiOS aprovados, nenhumQRnovo. Próxima c33 controlador de descoberta com sessão+Screenreadyactive e botão adaptativo emMinhasconexões, flaginventoryDiscoveryEnabledfalse; sem solicitarIDs/testes/aprovação.

c33/MPG-48 concluída: discoverycontroller/runtime exigemScreenreadyactive/sessão/gates, lifecyclecancel/1inflight/statusautenticado/revisãopending e avisos semIDs/valores; botãoadaptativo emMinhasconexões oculto porinventoryDiscoveryEnabledfalse.954testes/typechecks/exportiOS/runtimeaudit1204fontes56instâncias/raízesausentes/mapasprivados aprovados. Nenhuma consulta deprovedor. Próxima c34 autenticação técnica somente POST/auth comperfil privado, sembuscaritem/conta/valor, e publicarcliente consolidado depois CI/scan.

c34/MPG-49 concluída: provider-profile.py authenticate validou credenciais em1POSTAuthreal, sem qualquerGETitem/conta/identidade/valores e semsalvar/exibirAPIkey.958testes/typechecks aprovados; init/checkcontinuamoffline. Não inferir titularidade/cobertura/OF/privacidade. Próxima c35 publicaçãoExpo consolidada usandoexport/UI c33 e runtimeaudit1204/56 jáaprovados, apósCI/scan, atualizarmanifest/hash/QR/docs sem pedirteste.

c35 emandamento: publicarprévia consolidada da descoberta protegida apósCI do commitderelease e scan detodosperfis. Distclienteexportado c33, runtimeaudit1204/56,958testes/typechecks e authfinal completo aprovados. Não repetirAuth real; total1Auth/0financeiros. Próxima apóspublicação: configuração backend desativada/revisão, semaçõesmanuais do titular.

c35 concluída: prévia remota update01a15ba3-efdc-7ce4-b328-fa16a89c0e12/grupo41095d0a-c262-4850-a4ab-122bdce6caf0/commitbe80325, CI39514871905success/manifestscheme/hashHBC/QRoficial conferidos;docs/QRatualizados.958testes/runtimeaudit1204/56/mapasprivados/scantodosperfis aprovado. Não pedir testeintermediário; flagsfinanceiras/descobertafalse. Próxima c36 configuração backend desativada com secretemmemória/transmissãoTLS/SupabaseSecrets sem logs, validar por digests e manter código/envfalse.

c36 concluída:7segredosclouddo backend confirmados porSHA256,4flagsfalse/códigoliveApprovedfalse. Plataforma incrementoubridge5/metadata4; auditoriareadonly23+5fontes confirmou todoshashesdosrecibos, reconciliadasversõesprivadas.967testes/typechecks+7smokesoff+5negativosmetadata aprovados;zeroFinanceReads/1AuthPluggytotal. Próxima c37 fonte nativa ExpoFetch/URLSession/cache/cookies, sem colocar dadosreais noGo antes de revisão. Não pedir testes/credenciais/IDs.
