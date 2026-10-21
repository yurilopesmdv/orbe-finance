# Estado de retomada — 21/10/2026

## Direção e próxima ação

Trabalhar no **Orbe**, `/home/yurilopesm/projects/orbe-finance`, main. Não alterar o F1, mesmo quando cwd/sandbox apontar para ele. Usuário reiterou continuidade automática e quer adiantar a finalização hoje: uma microtask por vez é sequência com checkpoint, sem pedir “pode continuar”, novas aprovações ou testes físicos intermediários. Integrador único, sem subagentes. Cores/identidade visual ficam para depois. Nenhum serviço pago ou contato com terceiros foi autorizado.

**Concluídas c21–c42 e T22c1–c11.** Ver planos e evidências em `tasks/TASKS.md`. **1064 testes/typechecks locais aprovados:942 Node +122 Python**, log `/tmp/orbe-check-verified-session.log`. Allowlist backend31fontes e scan de todos os perfis privados passaram. Cliente não mudou desde c38; não repetir exportação/QR por módulos backend isolados.

**Próxima T22c12:** spec→plan→tasks e migration14 para `orbe_resolve_movement_read`, service-only, com p_session_id, check transactions, sessão real via helper privado da13 e lease atual/expiração. Retornar apenas owner/session/connection/revision/lease/expiry e projection de bindings técnicos, limitando100 (fronteira transacional), sem classe BANK inferida ou valores. Estender fixture de movimento com bindings fictícios/ACL/IDOR/sessão/capFalse/expiração; validar DDL+fixture em rollback antes de aplicar e preservar hash13. T22c11 concluída: Auth retorna sessionId interno só após GetUser+orbe_has_session; metadadoslegados semsid continuam compatíveis, HTTP não expõe sid. Depois RESTports/coordenador de progresso; cliente movements.read precisará response1MiB específico, demais128KiB.

## Situação do titular e dos bancos

Conta Orbe já criada. Não refazer cadastro, gerar OTP ou pedir senha/e-mail/IDs pelo chat. Titular confirmou retomada sem senha ao alternar apps e proteção de captura/multitarefa no iPhone. Não inferir cold restart, logout, gravação, VoiceOver, cache ou outras versões; teste final agrupado depois.

Bradesco e Mercado Pago estão conectados no portal pessoal. A demo selecionada mostrou **um item MeuPluggy com conta e cartão Mercado Pago**, não dois bancos. Um detalhe filtrado não prova a listagem completa nem agregação dos dois bancos. Item MP fornecido foi guardado apenas no inventário privado e cadastrado no Supabase como `pending`, sem capacidades/OF/contas. Bradesco na aplicação ainda não foi identificado. Não duplicar IDs, procurar valores ou pedir nova autorização bancária agora.

**Uma chamada Pluggy real no total: somente POST/auth**, credenciais técnicas válidas. Zero leituras financeiras por ferramentas. A API key temporária não foi guardada/exibida/usada para GET. Não repetir Auth desnecessariamente. IA/MCP/devtools não podem acessar conteúdo financeiro real, mesmo read-only. Não abrir Dashboard privado, cookies ou endpoint global de itens.

## Código preparado

SDK57.0.30/RN0.86.3/React19.2.3/TS6.0.3; iPhone11/iOS26.6.2/ExpoGo57.0.9. Node correto: `/home/yurilopesm/.nvm/versions/node/v22.23.2/bin`, npm12.2.0. Node18 default não serve. Expo Go/orçamento zero mantidos; Face ID off, sem exigir build pago.

Login lembrado: refresh token rotativo no Keychain com passcode/device-only/origem/prazo30dias; nenhuma senha, accessJWT ou finança persistida. Revalidar Auth owner/sessão antes de desbloquear; background/lock abortam e limpam memória, logout revoga em best effort. Metadados aguardam proteção pronta/ativa antes de consultar. Requests privados usam no-store/no-cache/Pragma; fonte nativa instalada revisada, sem certificar todo o binário Go.

Cliente: rememberedLogin/ownerSetup/metadataStatus true; publicRegistration/liveIntegration/accountReads/inventoryDiscovery/privateFinancialDataApproved/biometricLogin false; dataMode synthetic. Demonstração de gastos/carteira/metas/relatórios não é integração bancária.

Contas/descoberta: cadeia preparada Auth→owner/revisão/binding→lease global→Auth Pluggy→consentimento atual→contas exatas/DTO mínimo→revalidação/finalize→memória. Descoberta retorna só status/contagem; cria bindings pending, não aprova OF/capacidades. Deadline/lease120s, cooldown900s; commit remoto pode acontecer antes de cancelamento/resposta, sem promessa de rollback distribuído. Rede fixa própria/Pluggy; nenhum cookie/redirect/URL arbitrário. Boots têm modos fixture/live explícitos com codegate e flags independentes; **entrypoint publicado liveApproved:false**.

Movimentos T22c1–c10, isolados do runtime: HMAC-SHA256/UUIDv8 por owner+conta interna+ID externo; chave própria ainda não provisionada. Janela mensal IANA cobre diaUTC seguinte sem exceder31dias por consulta,1200meses testados. Projeção BANK com direção explícita, centavos exatos, unknown para tipo financeiro sem prova, sem extras/IDs externos no DTO; overrides preservados no ledger. Decoder transações1MiB e leitor dedicado, default contas/Auth128KiB. Cursor AES-GCM até512chars com AAD owner/sessão/lease/revisão/mês/item/manifesto, TTL<=120s; não é uso único global e cursor grande falha sem truncar. Manifesto BANK vem do tipo da fonte e bindings completos, ordenado por ID interno; cartões/moedas não suportadas são exclusões explícitas. Port de transporte já integrado em módulos privados com chaveAPI na closure; progressoSQL de páginas também foi aplicado; faltam integração REST/coordenadorHTTP e cliente antes do uso real. Nenhuma nova factory foi ligada ao entrypoint ou configurada com chave real.

## Infraestrutura e publicação

Supabase próprio/us-east-1; ref público `vvaufaoahotmaocrcyij`. **13 migrations imutáveis/hash verificadas**, última `20261021100000_movement_page_progress`. Testes SQL com identidades fictícias/rollback, sem resíduos ou mudança de owner. Banco guarda metadados, nenhum saldo/movimento/posição. Signup false, senha12+, JWT600/refresh rotation; SMTP/recovery false.

**orbe-bridge v6 ACTIVE**, código financeiro literal off; **metadata v4 ACTIVE**, snapshot anterior com protocolo/default128KiB preservados. c5 publicou bridge após CI39587278861 success e1014testes; sete rotas503/no-store e cinco negativos Auth/metadados passaram. Owner positivo não foi testado. Nenhuma mudança de segredos/flags na publicação. Sete segredos backend haviam sido configurados na c36 por digests; quatro flags financeiras false. Recibos privados por função, não inventar igualdade de snapshots entre versões.

Prévia Expo c38: update `01a15bbf-7194-7ce1-8903-b8ca5ff4e0e3`, grupo `1dbf421d-740d-47d5-aff6-8858a3b7732e`, commit `ad2dcc3`. EAS próprio `69843dfe-ab1b-469e-bb78-c7948bbf1d9b`, ios/preview/runtimeexposdk:57.0.0/schemeorbe. Manifesto/hashHBC/linkQR oficial conferidos; `docs/EXPO-PREVIEW.md` e PNG em docs/assets. JS auditado1205fontes/56instâncias, sourcemaps privados. Não iniciar Metro/LAN/túnel/firewall; o app abre remotamente.

## Gates e escopo ainda pendentes

Primeiro saldo: origem OF original por banco, evidências do fornecedor/retencão/logs/subprocessadores, dependências/runtime e homologação privada final. Proxy MeuPluggy não prova origem original. Pesquisa c40 distingue MCP público de portal autenticado e exclusão de item de backups; não é prova de incidente ou aprovação universal. Perguntas externas preparadas, não enviadas. Não contatar fornecedor sem instrução.

Dois advisories altos sem patch oficial na revisão: braces/node-forge,19 instâncias afetadas/0críticos. Ausentes do JS cliente, mas tooling tem caminhos relevantes; c42 não provou inatingibilidade global. Exceção só sintética até23/10, cutoff24/10 00UTC. Não estender, suprimir, aplicar downgrade Expo44/updates0.11 ou declarar risco zero/E2EE.

Movimentos ainda precisam coordenadorHTTP/progressoSQL e cliente; investimentos/cofrinhos precisam adapters de fonte/paginação/cobertura próprios. Modelos sintéticos já existem. Finalização completa não pode ser declarada por número de testes; não mudar estado/capacidades/verifiedAt para fabricar evidência.

## Operação privada e Git

Orbe writes/npm/Git/network usam `require_escalated` sob auto-review; não pedir confirmação textual sem rejeição real. Main: `git@github.com:yurilopesmdv/orbe-finance.git`, identidade Yuri Lopes, Conventional Commits em português, sem coautoria extra. Push autorizado; executa CI, não EAS automático. Conferir último CI após cada alteração relevante.

Perfis em `~/.config/orbe-finance/`0700/arquivos0600: backend.env(PAT/ref/owner), expo-publish.env(token Expo reutilizado do F1 por autorização explícita somente para publicação), pluggy.env(ClientID/Secret), pluggy-items.json(v2/lista1–5). `.env.backend.local` só pointer; `.env.local` só configuração pública própria. Nenhuma chave Supabase F1 reutilizada. Nunca cat perfis/recibos/logs privados ou imprimir valores.

Helpers offline: provider-profile.py check, provider-items.py check, publish-preflight.py. Staging MP já concluído; não repetir. financial-config.py configura somente disabled e reconcilia drift de versão apenas após prova de fontes/recibos. bridge-deploy.py exige entrypoint exato off e allowlist; nova fonte precisa ser adicionada, mas módulo isolado não exige deploy por task. metadata-deploy pode atualizar segredos/versões: não usar por conveniência.

Publicar cliente só quando mudar: check→export/runtimeaudit→scan todos perfis→Git/CI→publish:expo→verificar manifesto/hash/QR→docs. Publicador exige scan offline antes da CLI autenticada; EASCLI25.2.0/SupabaseCLI2.121.0 cacheados. Helpers `/tmp/orbe-verify-release.py`, `/tmp/orbe-qr.cjs`; recibos/maps fora do Metro.

Scan completo antes de Git/export: carregar private_canaries de scripts/bridge-deploy.py com admin.private_values(), excluir somente SUPABASE_PROJECT_REF público e comparar valores não vazios contra git ls-files cached/others/exclude-standard e dist. Imprimir só booleano/quantidades. Nunca deixar untracked/edits sem registrar próxima ação antes de interrupção.
