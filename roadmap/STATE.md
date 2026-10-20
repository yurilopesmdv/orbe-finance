# Estado de retomada —20/10/2026

Repo `/home/yurilopesm/projects/orbe-finance`, main, independente do F1. Usuário pediu continuidade automática sem pedir aprovação/“pode continuar”, uma microtask de cada vez com checkpoint: spec→plan→tasks→implement→validate→commit/push. Integrador único, sem subagentes. Orçamento zero/iPhone11/iOS26.6.2/ExpoGo57.0.9/SDK57; identidade visual depois. Não acessar dados financeiros reais por IA/MCP/ferramentas. Nenhum serviço pago ou mensagem a terceiros autorizado.

## Ação imediata

**c21–c28 concluídas**, evidências em tasks/TASKS.md/plan, SPEC009 MPG-36–43. **921 testes/typechecks aprovados (830Node+91Python)**. CI39511853244(c26)success; commits posteriores ainda precisam de push/CI. Próxima **c29**: definir contrato explícito fixture/live e preparar boot real sem passar produção comofixture; manter gates financeiros fechados. Depois composição/publicação desligada e integração de descoberta no cliente, revisando privacidade/OF/dependências antes de ativar.

Não parar após cada task ou pedir teste intermediário. Não repetir instruções de conexão/IDs ao titular. Perguntas antigas já respondidas. Há trabalho técnico independente; fornecedor/OF/retenção e homologação não podem ser inventados.

## Situação bancária confirmada

Titular conectou Bradesco e MercadoPago no portal pessoal, depois MeuPluggy na aplicação demo de desenvolvimento. Capturas mostram2bancos na origem e detalhe de1item na demo com produtosMP (conta+cartão; “Contas2” não significa2bancos). URL enviada seleciona itemId, não prova listagem completa. Não presumir um item por banco nem que1item agrega todos. ItemMP fornecido foi salvo apenas no perfil privado e cadastrado noSupabase como **pending**, confirmado por booleano:1MPpending, semOF/capacidades, nenhuma conta real registrada. Bradesco na aplicação ainda não identificado. Não copiar URL/ID/screenshot paraGit/logs nem pedir IDs decontas.

`~/.config/orbe-finance/pluggy.env` tem ClientID/Secret com formato/permissões válidos, sem comprovação remota; APIkey extra nãoénecessária. `pluggy-items.json` versão2 lista1a5itens, instituição bradesco/mercado-pago/unknown,1configurado/identificadoMP. `provider-items.py init/check` offline/redigido, migra sótemplatelegadovazio. `stage-provider-items.py check/stage` obtém backendsecret sómemória via GETliteralapi-keys?reveal=true, verifica projetohashes e chamaRPCpending porbody, nuncaPluggy. CadastroMPjáfeito, não repetirnecessariamente. **Zero chamadas reais Pluggy e leituras financeiras pelas ferramentas**.

## Código entregue e pendências de execução

Cliente Expo57.0.30/RN0.86.3/React19.2.3/TS6.0.3. Node22.23.2/npm12.2.0 em `/home/yurilopesm/.nvm/versions/node/v22.23.2/bin`; nãoNode18. Crypto/ScreenCapture/SecureStore57.0.4 incluídosGo.

Login lembrado guarda refreshrotativo noKeychain/passcode/deviceonly/origem/prazo30dias; nunca senha/accessJWT/finanças. RevalidaAuthowner/orbe_has_session antesunlock; lock/background cancelam/purgam, logoutrevoke/clear, requirePassword mantémrecênciaRLS. Titular confirmou criação deconta, retomada semsenha aoalternar e proteção de captura/multitarefa. Não inferircoldrestart/logout/gravação/VoiceOver/nativecache/30dias/outrasversões; roteirofinaldepois. FaceIDoff/ExpoGoiOSnão suporta; nãoexigirbuildpago.

Runtime cliente rememberedLoginEnabledtrue; accountReadsEnabled/liveIntegrationEnabled/privateFinancialDataApproved/biometricLoginEnabledfalse; dadossintéticos. Minhascontasoff não instancia portas/cache/UUID/rede. Futuroready exige sessão+screenreadyactive, UUIDcryptolocal, registryRLSinterno, scopeaccounts-only e cachevolátil/valoresocultos. Demo de gastos/relatórios/investimentos/cofrinhos não comprova integraçãoreal.

Backendpreparado de leitura: Auth→owner/revisão/lease→bindingprivado→PluggyAuthchaveclosure119min→GETitemconsentatual→GETaccounts→decoderexato/BigInt/DTOsemPII→reAuth/release→finalize→cliente. CREDITnãoé saldo/limite; bindings técnicosCREDIT existem só para validar antes da exclusãofinanceira. BRL/USD/EUR2casas; null/unknown/coveragefalse/data nãoinferida.

Descoberta prepared: Authowner→resolvepending→leaseglobal→check→AuthPluggy/itemconsent/accounts→projeção somenteIDs/moeda→reAuth/reResolve/check→commitSQLatômico. Não lê balance/name/number/owner/creditData na projeção, retorna aoHTTP somentecontagem. Conexãopermanecepending/semOF/capacidades. Deadline120s/globallease120s/cooldown900s; cancelamento/perdaresposta apóscommit pode deixar metadatapendingidempotente, não prometer rollback distribuído. Handler1inflight/close/Bearer/bodyinterno16KiB/no-store. Rede literal própria/PluggyAuthitemaccounts, cookies/headerscruzados/redirect/outroshosts recusados;128KiB sóstage/commit.

`account-configuration.ts` centraliza gates/host/chaves/probeantessegredos. `account-runtime.ts` e `inventory-runtime.ts` ainda **fixtureOnly+transportinjetado**; novoentrypointfinanceiro não os importa. c29 deve introduzir modos explícitos com aprovação independente, sem burlar isso usando fixturetrue emprodução. Nenhum segredo deprov carregado nacloud, nenhuma chamada financeira real.

## Supabase e segurança

Projeto próprio refvvaufaoahotmaocrcyij/us-east-1. **12 migrations imutáveis/hashverificadas**, última20261020190000_pending_inventory_leases. SQLowner/sessão/RLS/lease/pausa/remoção/binding/staging/inventário/nonce/cooldown/atomicidade com identidadesfictícias+rollback passaram; zeroresíduos e ownerpreservado. Sem tabelas devaloresfinanceiros. Appownerglobalfixo/signupsfalse;JWT600/refreshrotation/pw12. SMTP/recoveryfalse; não regenerarOTP/enviar e-mail.

**orbe-bridge v3ACTIVE/literalfalse503**, metadata v3ACTIVE/Authowner/session/RLSsomente. Smoke ponte3off/metadados5negativos passaram. Reciboantigov1 reconciliadoparahash/version3 por downloaddereadonly, semmudançaremota. Allowlistbridge-deploy.py17files antiga: revisar explicitamente paraqualquer novosartefatos; não redeploy porfixture. ProbeEdge comprovou decoder9007199254740993/0.29 e foi removido, semprovedor.

Reais ainda nãoaprovados: origemOFporbanco, revisãofornecedor/subprocessadores/logs/retencão/exclusão, dependências e runtimeprivado/homologação. Não garantir vazamentozero/E2EE nem tratarausênciadenotícias comoaprovação. Audit19altos/0críticos/2raízes braces/node-forge sempatch na últimarevisão; exceção sósynthetic até23/10(cutoff24UTC), nãoestender ouaplicar downgradeExpo44/updates0.11. JSexport1201fontes56instâncias semraízes não certifica toolchain/nativo/EAS/fornecedor. docs/security/ACTIVATION-BLOCKERS-20261020.md temquestõesexternas nãoenviadas. Não contatarfornecedor seminstrução.

## Publicação, segredos e continuidade

ÚltimoExpo permanece update01a15a72-7573-7ea8-a2e6-e45df58e640a/grupo260de9bf-5ad0-460d-870a-d2a69a356e47/commit239c7c1, iospreview/runtimeexposdk57.0.0/schemeorbe. QR docs/assets/orbe-expo-go-20261020.png e docs/EXPO-PREVIEW.md; link exp://u.expo.dev/update/01a15a72-7573-7ea8-a2e6-e45df58e640a. Manifesto/hashHBC/linkQRconferidos, recibosprivados. Backend-only nãoexigeQRnovo.

SandboxcwdF1; writesOrbe/Git/npm/network usam require_escalated/auto-review. GitYuriLopes/ConventionalCommitsemportuguês/main/pushautorizado, sem mençãoaagente. PushOrbeexecutaCI, nãoEASautomático. Usar check→exportiOS/runtimeauditquandoafetarcliente→scan→Git/CI→publishwrapper→manifest/hash/QR→docs. Não usarMetro/LAN/túnel/firewall; Metro/DockerOrbeparados, não mexeroutrosprojetos.

`~/.config/orbe-finance/backend.env`0600/dir0700: PAT/ref/ownerUUID; `.env.backend.local` sópointer. `.env.local` sóSupabaseURL/publishable/recoveryfalse. ExpoTokenF1reutilizado porautorização explícita só emexpo-publish.envprivado; nenhumF1Supabase. EASprojeto69843dfe-ab1b-469e-bb78-c7948bbf1d9b/yurilopesmdv/orbe-finance, CLI25.2.0cachedignore-scripts. Helpersprivados: /tmp/orbe-scan-current.py, orbe-verify-release.py, orbe-qr.cjs. ScanIDs doinventário também antes doGit, semimprimirvalores. Não catprofiles/recibos/brutos/sourcemapsprivados. ReparoGit19/10feito, nãorepetirreset.

c29/MPG-44/ADR-016 concluída: móduloslowlevel têm ExecutionPolicyfixture/live, compatibilidadefixtureOnly sótests, liveexigeprivateDataApprovedtrue, conflitosfalhamfechado. Capturamodo emfactory e regressões921aprovadas; nenhum boot/entrypoint/flagreal alterado. Próxima c30 atualizarfactorysdeboot para execução explícita sob liveApproved(código)+3flags, fronteira de rede e defaultfetchsomenteapós gates; entrypointpublicado segueoff.
