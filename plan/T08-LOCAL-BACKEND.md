# T08 — Backend local independente

Estado: blocked para execução local/remote; configuração preparada e serviços parados. Base c15c2c8. PRD-07/AUTH-02. Paths supabase/config.toml, supabase/migrations/*, docs/DESENVOLVIMENTO.md e checkpoints. Nenhum login Supabase cloud, projeto remoto, .env ou segredo F1.

CLI oficial2.121.0 fixado nos comandos; init criou somente configuração local. Postgres17, API54341/DB54342/Mailpit54344 (e shadow54340), project_id orbe-finance. Signup público/anônimo, Storage, Realtime, Studio/IA, analytics e runtime de Edge desligados. JWT10min, senha mínima12, OTP10min, rotação ativa. Email capturado localmente, sem enviar ao titular.

Docker network própria orbe-finance-local com host_binding_ipv4=127.0.0.1; verificar bindings dos containers após subir. Não usar firewall/túnel. API em HTTP somente loopback e sintéticos; não é configuração de produção nem acessível diretamente pelo iPhone. Banco novo próprio, baseline versionada cria apenas schema privado sem acesso de anon/authenticated. Aplicar conexão/ownership na T13, não antecipar registro bancário.

Serviços mínimos locais: DB, Auth, Kong, PostgREST, captura SMTP. Sem credencial emitida no console/chats: saída de start/status deve ir a arquivos privados temporários. Nenhuma imagem/container de outro projeto deve ser parado, removido ou reconfigurado. Preparação remota fica pendente até projeto próprio/credenciais/autorização aplicável, sem reutilizar F1.

## Resultado observado

CLI iniciou serviços e aplicou preparação local, mas inspeção real detectou Mailpit publicando54344 em0.0.0.0 e:: apesar de --network-id orbe-finance-local e opção de driver127.0.0.1. Launcher detectou o desvio e parou somente Orbe, sem remover volumes. Docker do host não foi reconfigurado. Essa proteção também aceita loopbackIPv6::1, mas nunca wildcard. Não declarar loopback validado; stack permanece parada.

T08 não concluída: solicitado ao titular token Supabase separado no .env.local para preparar projeto cloud de desenvolvimento sem plano pago/finanças reais. Antes de iniciar Metro/build, mover somente credencial administrativa para .env.backend.local, fora do carregamento automático Expo. Se não houver credencial, continuar domínio/UI sintéticos independentes. Nenhum token existente F1 foi lido.
