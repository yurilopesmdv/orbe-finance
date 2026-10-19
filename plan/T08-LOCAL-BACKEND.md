# T08 — Backend local independente

Estado: done via projeto cloud próprio em 19/10/2026; alternativa local continua bloqueada e parada. Base c15c2c8. PRD-07/AUTH-02. Paths supabase/config.toml, supabase/migrations/*, docs/DESENVOLVIMENTO.md e checkpoints. Nenhum login Supabase cloud, projeto remoto, .env ou segredo F1.

CLI oficial2.121.0 fixado nos comandos; init criou somente configuração local. Postgres17, API54341/DB54342/Mailpit54344 (e shadow54340), project_id orbe-finance. Signup público/anônimo, Storage, Realtime, Studio/IA, analytics e runtime de Edge desligados. JWT10min, senha mínima12, OTP10min, rotação ativa. Email capturado localmente, sem enviar ao titular.

Docker network própria orbe-finance-local com host_binding_ipv4=127.0.0.1; verificar bindings dos containers após subir. Não usar firewall/túnel. API em HTTP somente loopback e sintéticos; não é configuração de produção nem acessível diretamente pelo iPhone. Banco novo próprio, baseline versionada cria apenas schema privado sem acesso de anon/authenticated. Aplicar conexão/ownership na T13, não antecipar registro bancário.

Serviços mínimos locais: DB, Auth, Kong, PostgREST, captura SMTP. Sem credencial emitida no console/chats: saída de start/status deve ir a arquivos privados temporários. Nenhuma imagem/container de outro projeto deve ser parado, removido ou reconfigurado. Preparação remota fica pendente até projeto próprio/credenciais/autorização aplicável, sem reutilizar F1.

## Resultado observado

CLI iniciou serviços e aplicou preparação local, mas inspeção real detectou Mailpit publicando54344 em0.0.0.0 e:: apesar de --network-id orbe-finance-local e opção de driver127.0.0.1. Launcher detectou o desvio e parou somente Orbe, sem remover volumes. Docker do host não foi reconfigurado. Essa proteção também aceita loopbackIPv6::1, mas nunca wildcard. Não declarar loopback validado; stack permanece parada.

T08 não concluída: solicitado ao titular token Supabase separado no .env.local para preparar projeto cloud de desenvolvimento sem plano pago/finanças reais. Antes de iniciar Metro/build, mover somente credencial administrativa para .env.backend.local, fora do carregamento automático Expo. Se não houver credencial, continuar domínio/UI sintéticos independentes. Nenhum token existente F1 foi lido.

## Retomada cloud em 19/10/2026 — doing

Usuário criou projeto Orbe próprio e forneceu PAT/ref no arquivo privado .env.backend.local. Identidade confirmada via Management API: nome orbe, ativo/saudável, região us-east-1. Usar esse destino, não criar outro. O helper local continua rejeitando cloud. Próxima ação é baseline remota com migration versionada e histórico oficial, após verificar ausência de tabelas de aplicação; configuração Auth restrita sem criar usuário, SMTP ou dados bancários. Não habilitar live no app.

Ferramenta administrativa deve carregar somente arquivo .env.backend.local, restringir domínio de destino api.supabase.com, não seguir redirects, nunca exibir resposta bruta/credencial; verificar nome/ref antes de mutação. Operações explícitas inspect/bootstrap, sem SQL arbitrário recebido por argumento. Guardar apenas verificações sanitizadas na documentação. Segredos não entram no bundle ou Git.

## Evidência cloud

PAT/ref confirmaram projeto orbe ativo/saudável, região us-east-1, zero tabelas de aplicação e zero migrations antes de aplicar. Baseline 20261016170000 aplicada pelo endpoint oficial de migrations; histórico usa nome orbe_<arquivo>_<sha256>, com versão atribuída pela API. Reexecução conferiu hash e manteve uma única migration. Não usar CLI db push remoto: histórico é administrado pelo helper Management API, enquanto CLI permanece exclusivo da alternativa local.

Config Auth conferida após PATCH: signup/anônimo/telefone desligados, senha12, JWT600, rotação e confirmação ativas. Schema privado sem USAGE para anon/authenticated. Nenhum usuário/email/dado bancário criado. TypeScript e107 testes passaram, sendo7 guardas administrativos. Exportação iOS passou e busca do token administrativo nos artefatos retornou ausente. Isso valida esse token/artefato, não constitui prova universal contra vazamento. Auditoria manteve18 alertas conhecidos/2 raízes, exceção somente sintética até23/10.

Fontes: https://supabase.com/docs/reference/api/v1-apply-a-migration e https://supabase.com/docs/reference/api/v1-update-auth-service-config, consultadas em19/10/2026. T10 inicia allowlist de proprietário; usuário cria sua identidade/senha diretamente no Dashboard, sem compartilhar senha.
