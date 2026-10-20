# Estado de retomada —20/10/2026

Repo **/home/yurilopesm/projects/orbe-finance/main**, independente do F1. Integrador único, uma microtask por vez, **spec→plan→tasks→implement→validate→commit/push**. Titular pediu seguir sem esperar testes intermediários, priorizar acesso às contas e concluir o que não depende dele. Não pedir “pode continuar”. Orçamento zero, Expo Go; cores/identidade visual depois. Nenhum banco/consentimento/pagamento autorizado antes dos gates. Não usar ferramentas/IA/MCP com finanças reais.

## Entrega atual e ação imediata

**T51b2c1–c11 concluídas**: cadeia técnica de contas toda em fixtures;827 testes/typechecks aprovados, exportiOS2.7MB/scan, audit19mesmos/JSruntime1201fontes56instâncias semduasraízes (mapasprivados). T51b2c12 doing: publicar tela c8 no EAS após CI última verde, verificar manifesto/hash/QR, docs/checkpoint/push. Ler plan/T51b2c12-ACCOUNT-PREVIEW-RELEASE.md. Código cliente b29dab1 jáCI39467658558 success; último50283c8/CI39469420951 em andamento ao checkpoint. Backend c10 adc39cf/CI39468607516 success; c9 1c63ad7/CI39468131238 success.

**Última prévia publicada ainda T65b1** até concluir c12: update01a15a30-9dfd-773a-ba38-2c283d4cd2bd/grupo2cfdc1b2-412b-4f30-b3c4-6d751a196f71/commite2bfeaa. QRdocs/assets/orbe-expo-go-20261020.png e docs/EXPO-PREVIEW.md serão atualizados. Não mandar QR de Metro/LAN; usuário não quer PC ligado. Não pedir teste agora.

**Aceites físicos já recebidos**: criou conta; retomou sem senha ao alternar apps; “Captura e multitarefa protegidas”. iPhone11/iOS26.6.2/ExpoGo57.0.9/SDK57. Não repetir perguntas, não gerar OTP nem acessar senha. Não inferir coldrestart/logout/gravação/VoiceOver/cache nativo/30dias/outrasversões; ficam no roteiro final.

## Código e gates

Cliente Expo57.0.30/RN0.86.3/React19.2.3/TS6.0.3. Node22.23.2/npm12.2.0 em /home/yurilopesm/.nvm/versions/node/v22.23.2/bin; não defaultNode18. Crypto57.0.4/ScreenCapture57.0.4/SecureStore57.0.4 incluídosGo, versões fixas. FaceID/requireAuthentication não suportados iOSGo; SQLCipher requer buildpróprio, não exigir custo automaticamente.

runtime rememberedLoginEnabledtrue; accountReadsEnabled/liveIntegrationEnabled/privateFinancialDataApproved/biometricLoginEnabledfalse; dataModesynthetic. Tela Minhas contas preparada: valoresocultos/mesmoCards, off não instancia portas/cache/UUID/rede; composição exige3gates. UUIDcrypto aleatório local sóapóssessão+screenreadyactive. SessionAuthKeychain guarda refreshrotativo/passcode/deviceonly/origem/prazo30dias, nunca senha/accessJWT/finanças. Revalida Authuser/owner/orbe_has_session antes de unlock; logout clears/revokebesteffort e requirePassword suprime refresh para ação sensível. SemalterarrecênciaRLS.

Backendpreparado: AuthSupabase remoto+RPCsessão→ownerconexãorevisão→lease→resolverprivado→PluggyAuthkeyclosure119min→GETitemliteral consentfuturo→GETaccounts→decimaloriginalBigInt→DTOsemPII→Auth/lease novamente→finalize→clientgateway→SyncSession/cachevolátil. CREDIT excluído/parcial, sem somar limite. BRL/USD/EUR2casas; outrasnull. Data/relação/cobertura desconhecidas ficam null/unknown/false; updatedAtnãoévaluation. Registrymetadata sob RLS retorna só IDs internos, contexto usaUUIDlocal semAuthsubject. Productsaccounts-only explícito preserva capabilities/cache outrosprodutos. Readinesssession/protection/active e close cancelam/purgam; snapshots sófase/aviso. Timeoutrequest20s/global120s, capbackend4, no retry/cron/webhook/polling. Supplierports/boot **fixtureOnly**, transporteinjetado/3flagsliteraltrue/ownprojectpinned, nenhum entrypoint ativo importa adapter.

**Não pronto para banco real.** OriginalOpenFinanceporbanco, fornecedor/subprocessadores/retencão/logs/exclusão, dependências/runtime privado, configuração/bindings/deploy/homologação permanecem gates T47/T52/T56/T63/T78. Expiradoproxy pode retornar vazio comUPDATEDantigo; c9 verifica consentExpiresAt antes/depois, não apaga porvazio. NomeMeuPluggy/isOpenFinancefalse do proxy não prova origem do banco nem titularidade. Prioridade PF Bradesco/MercadoPago, Inter/Nubankdepois, semimportmanual. Movimentos/investimentos/cofrinhos/relatórios reais têm fatias posteriores; demonstração completa não comprova cobertura.

Audit19afetados/duasraízes altas sempatch braces/node-forge; exceção somente sintética até23/10/2026(cutoff24UTC), não estender/forcefix. Ausência no JS não certifica toolchain/Go nativo/EAS/fornecedor. Não prometerzero risco/E2EE; banco/Pluggy/backend processam plaintext necessário. docs/ACCOUNT-ACCESS.md, ACCOUNT-ACTIVATION.md, RELEASE-READINESS.md separam entregue/pendente.

## Infraestrutura e evidências reais seguras

Supabase próprio refvvaufaoahotmaocrcyij/us-east-1 saudável. Oito migrations imutáveis aplicadas/hash verificadas, última20261020120000_account_read_bindings. SQLowner/sessão/RLS/lease/pausa/remoção/binding com identidades fictícias+rollback aprovados, zero resíduos/ownerpreservado. Sem tabelas financeiras.

**orbe-bridge v3 ACTIVE, literalfalse/503** (corrige antigav1 no histórico). Recibo privado tinha v1, investigado20/10: downloadreadonly index/core têm hashes iguais ao manifest antigo, coregit1f2b6a6832a1. MesmoID/version3/status/verifyjwtfalse conferidos; sórecibo local reconciliado, zero mudanças remotas. Smoke3off503 aprovado. **orbe-metadata v3 ACTIVE**, Auth/owner/sessão/RLS apenasmetadados,5HTTPnegativos aprovados. Pausa/remoção são sómetadata, não revogamno banco/provedor. Allowlist bridge-deploy.py17files, entrypoints exatos; não redeploy porfixture.

T51b2c11 probeEdge real confirmou context.source/decoder original com9007199254740993 e0.29, sóbooleanos. Função temporária **orbe-runtime-probe removida**, providercalls0, recibo/logprivadosedge-exact-probe.json/log. Não recriar semnecessidade. Não há segredosPluggy reais/bindings/consentimentos/contas coletadas. SMTP/recoveryfalse, não modificartemplates/enviar e-mail semtask própria.

## Operação, segredos e publicação

SandboxcwdF1 mas writesOrbe/Git/npm/network com exec_command require_escalated. GitYuriLopes/ConventionalCommitsportuguês/main/push autorizados, sem menção a agente. Nenhum subagente/skill/goal. Arquivos privados nunca stdout/chat/Git/export. /tmp/orbe-scan-current.py compara valores privados reais contra fonte/export sem imprimi-los; executarPYTHONDONTWRITEBYTECODE=1.

~/.config/orbe-finance/backend.env0600/dir0700 temPAT/ref/ownerUUID; .env.backend.local sópointerORBE_BACKEND_ENV_FILE. .env.local sóURL/publishable/recoveryfalse. Não copiarF1Supabase. ApenasEXPO_TOKEN reutilizadoF1 porautorizaçãoexplícita está ~/.config/orbe-finance/expo-publish.env0600. EASpróprio69843dfe-ab1b-469e-bb78-c7948bbf1d9b/yurilopesmdv/orbe-finance. CLI25.2.0 cachedignore-scripts. app.json schemeorbe obrigatório/runtimeexposdk57.0.0/ios/preview.

Sequência check→export:ios→security:runtime/scan→commit/push/CI→publish:expo(wrapper)→manifest/hash/QR→docscheckpointGit. PushOrbe sóvalida, publishmanualautorizado. Export semtokens; mapas/report ~/.config/orbe-finance/runtime-audit privados/nãoupload. Distcliente2.7MB jápronto c8; c9-c11 sóbackend/docs nãoimportados. Recibos eas-publish-receipt.json/log foraMetro. Helpers /tmp/orbe-verify-release.py obtêmmanifestmultipartUAExpo57/Acceptmultipart e conferem id/branch/runtime/scheme/launchhashHBC, linkQRoficial. Salva /tmp/orbe-public-release.json e orbe-published-link.txt. /tmp/orbe-qr.cjs geraPNGdeterminístico emdocsassets a partirdolink. Sem imagegen. Não imprimirrecibo integral/base64/tokens.

Metro/DockerOrbe parados, semLAN/túnel/firewall; não tocaroutroscontainers/projetos. Git reparado19/10 com hashes/fsck ebackups/tmp, não repetirsemfalha. Próximas pendências objetivas e o que titular fará no navegador estão ACCOUNT-ACTIVATION; não pedir credenciais agora nem concluirproduto financeiro por testes fictícios.
