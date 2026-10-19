# SPEC-001 — Acesso, sessão e privacidade

**Revisão vigente 0.4:** [SPEC-009](../../specs/009-meu-pluggy/spec.md) seleciona Meu Pluggy para integração automática Bradesco/Mercado Pago PF. [Plano vigente](../../plan/MEU-PLUGGY.md). Esta revisão prevalece sobre escolhas conflitantes abaixo; Open Finance é a única origem financeira admitida. Pesquisa pública permite seguir no planejamento, sem aprovação de dados reais.


Estado: ready para R1 sintética; dados reais continuam bloqueados. Depende de SPEC-000. Objetivo: impedir acesso aos dados financeiros sem autenticação e recuperar acesso sem expor credenciais.

| ID | Requisito |
|---|---|
| AUTH-01 | DEVE permitir login por e-mail e senha, recuperação e saída; criação de conta inicial restrita ao proprietário, sem cadastro público aberto |
| AUTH-02 | DEVE validar autorização no servidor e nas tabelas, incluindo relações entre entidades; esconder telas não é controle suficiente |
| AUTH-03 | DEVE manter tokens em armazenamento protegido adequado ao runtime, nunca senha em texto, AsyncStorage ou logs; remover sessão e dados em memória no logout |
| AUTH-04 | DEVE iniciar bloqueado a cada abertura e bloquear ao entrar em segundo plano; no Expo Go, desbloqueio requer reautenticação por senha validada pelo serviço |
| AUTH-05 | DEVE evitar exposição de valores no alternador de apps e bloquear renderização até concluir autenticação; não prometer blindagem contra captura de tela |
| AUTH-06 | DEVE tratar erro de senha, limitação de tentativas, rede ausente, sessão expirada e recuperação sem revelar existência de contas |
| AUTH-07 | DEVE usar a biometria já cadastrada no iOS quando houver build compatível, com opt-in após login por senha, fallback para senha e revogação do opt-in |
| AUTH-08 | DEVE apagar dados pessoais por fluxo confirmado e reautenticado, cancelar consultas em curso e orientar revogação no provedor; retenção em backups deve ser explicitada |

Senha e sessão do Orbe, autorização bancária e Face ID são três coisas diferentes. O Orbe não solicita senha do banco em formulários próprios e não recebe imagem/template facial. Bloqueio visual local não revoga automaticamente um token de sessão já emitido; logout e expiração têm regras próprias.

## Política inicial proposta

Senha: mínimo de 12 caracteres, aceitar gerenciador de senhas e colar, sem armazenar localmente. Sessão funcional é online: sem rede, uma abertura bloqueada não exibe dados. No Expo Go, preferir sessão sem persistência entre processos e limpar o acesso de sessão ao bloquear; validar comportamento com SDK escolhido. Se houver necessidade posterior de persistência, exigir decisão e teste de armazenamento antes de habilitar. Nesta fase, não há promessa de modo offline.

Recuperação: e-mail com código/fluxo HTTPS suportado pelo serviço, evitando depender de scheme próprio no Expo Go. Mecanismo exato e SMTP serão definidos no spike, inclusive expiração e limitação de envio. Administrador provisiona a única conta e desativa novos cadastros; defesa adicional por identidade permitida server-side, nunca somente por e-mail enviado pelo cliente.

O Face ID no Expo Go iOS é limitação confirmada em [pesquisa](../../docs/research/FEASIBILITY.md). AUTH-07 está deferred para R3; não criar botão que simule desbloqueio facial nem prometer leitura biométrica protegida do SecureStore no Expo Go.

## Aceite

- AC-A01: dado proprietário cadastrado, quando senha correta, acesso permitido; senha incorreta mantém tela protegida, sem valores atrás de modal.
- AC-A02: dado usuário autenticado, quando app vai ao fundo e retorna, exige senha antes de buscar/renderizar dados financeiros; redes lentas não deixam janela de exposição.
- AC-A03: dado logout, ao voltar por link/tela anterior não há dados nem sessão utilizável pelo cliente.
- AC-A04: dado um segundo usuário, consultas, filtros, UUIDs e endpoints de escrita de outro proprietário retornam negação; cliente não escolhe owner_id efetivo.
- AC-A05: dado Expo Go, opção facial não executa autenticação nem mostra sucesso fictício; com build futuro, cancelamento/falha não desbloqueiam.
- AC-A06: dado link de recuperação expirado, fluxo falha com orientação; novo código válido permite redefinir senha sem logging de tokens.
- AC-A07: dado apagar conta confirmado, filas deixam de consultar bancos; novos callbacks não recriam dados removidos.

Contrato T74 seleciona Supabase Auth em projeto próprio e Edge Functions para a ponte, com proprietário fixado no servidor. Projeto Orbe próprio criado pelo usuário em 19/10/2026; baseline em preparação; verificação de runtime/recuperação permanece em T01/T02.

## Contrato do spike T02

Spike isolado em spikes/access, sem pacote externo ou Supabase real. Estados: locked, authenticating, unlocked, recovery_pending, recovering. Inactive/background invalidam imediatamente a geração de trabalho, removem a sessão local e cancelam respostas financeiras pendentes. Resultado tardio de login/consulta nunca desbloqueia nem repõe conteúdo. Recuperação concluída exige novo login por senha e não libera finanças usando a sessão de recuperação. Expiração usa relógio injetável no teste, sem esperar tempo real. O adaptador real, autorização de servidor e testes físicos permanecem tarefas posteriores; este protótipo não deve ser importado pelo app de produção.

T08 cloud configura cadastro público/anônimo e telefone desligados, senha mínima12, JWT600s, rotação e confirmação de email. Não criar proprietário nem enviar email nesta etapa; provisionamento T10 separado. Destino recuperável inicial permanece local de desenvolvimento, sem wildcard/redirect público; fluxo real de recuperação fica T11. Nenhum token administrativo carregado pelo cliente.

## T10 — proprietário permitido no servidor

Registro privado singleton vinculado a auth.users, sem e-mail/senha/valores financeiros. Somente administração pode provisionar; configuração ORBE_OWNER_USER_ID privada aponta a identidade que o titular criou no Dashboard. Aceitar apenas conta confirmada e não anônima; negar troca silenciosa de dono. Ausência de registro nega acesso. Função sem argumentos orbe_is_owner resolve auth.uid() do contexto verificado, retorna apenas booleano, com search_path vazio e execução apenas por authenticated. Não expor UUID/registro aos clientes.

Teste transacional de duas identidades inventadas, ausência de sessão e grants; rollback integral. Autorização da ponte/RLS de futuras conexões continua T13/T17/T18. Cadastro/login/recuperação com identidade real exigem interação do titular no app; não ler nem solicitar sua senha em ferramentas.

## Recorte T11a — gateway Auth sem UI

Cliente REST usa somente origem HTTPS exata do projeto e publishable key, nunca PAT/service role. Entradas/senhas em corpo de requisição Auth; sem logs, parâmetros de URL com dados pessoais, cache ou persistência. Endpoint de token é grant password; validar resposta, identidade via /user e autorização server-side por orbe_is_owner antes de retornar sessão. Conservar apenas access token e expiração limitada a600s em memória; descartar refresh token. Falha de autorização ou resultado inválido tenta encerrar sessão sem expor resposta do provedor.

Recuperação por código usa recover/verify(type recovery), confirma proprietário antes de atualizar senha e encerra sessão de recuperação, sem liberar finanças. UI/template SMTP/entrega e AppState ficam T11b/T12; testes do gateway usam transporte inventado, sem disparar email real. Requisição limitada a20s, cancelável, recusa redirect no transporte e normaliza erros para códigos seguros. Suporte efetivo de redirect/timeout no iPhone precisa de validação física; não afirmar blindagem nativa apenas por RequestInit.

## T11b — integração Auth e telas

Configuração do cliente contém somente EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY em arquivo público ao bundle; origem conferida e chave selecionada por tipo publishable. Nenhum PAT/service role/UUID do dono no cliente. Administração prepara template de recuperação com código de6 dígitos, sem links/imagens externos; não envia e-mails de teste por ferramenta. Entrega real permanece a validar pelo titular/SMTP.

Sessão de aplicação mantém access token apenas em campo privado de uma máquina de estados; snapshots UI contêm somente estado e código de erro seguro. Emite mudanças por assinatura, expira por timer e confere expiração antes/depois de operações. Geração/cancelamento impedem que login/leitura tardios restaurem sessão após lock/logout. Recuperação nunca desbloqueia. Tela protegida redireciona bloqueado para login; demonstração pública permanece exclusivamente inventada e identificada. Campos de senha são limpos ao enviar/sair; nenhuma coleta bancária.

T12 conecta AppState e limpeza visual ao estado da sessão antes de expor finanças; enquanto isso, a tela autenticada mostra somente confirmação de acesso/limite demonstrativo. Não declarar login físico/entrega de recuperação concluídos sem titular.

Observação em19/10/2026: Management API recusou alteração de template no Free com remetente padrão (HTTP400). Recuperação por código fica desabilitada por EXPO_PUBLIC_AUTH_RECOVERY_ENABLED=false; não enviar pedido de código que não pode ser entregue. Não fazer upgrade/contratar SMTP automaticamente. Preparar telas/gateway com testes, mas recuperação efetiva continua bloqueada até SMTP próprio revisado e entrega comprovada. Login por senha independe disso.

## Recorte T12a — ciclo de vida

Provider observa estado inicial e mudanças de AppState. Somente active permite iniciar/receber sessão; inactive/background/estado desconhecido bloqueiam, abortam operações e tentam encerrar sessão, sem depender do sucesso remoto. Retornar active nunca desbloqueia automaticamente. Remover assinatura no unmount e ignorar eventos já enfileirados após remoção.

Formulário limpa e-mail/senha/código/avisos ao perder active e volta ao modo login. Tela protegida renderiza Redirect se sessão bloqueada; não cobrir conteúdo privado apenas com modal. Preferência demonstrativa de ocultação também volta a oculta. Expo Go não prova proteção contra captura/gravação/alternador nativo: T12b/T53/T38/T45 permanecem validação física e runtime. Face ID continua ausente.

## AUTH-09 — Guard de operação síncrona

Sessão DEVE permitir assertUnlocked sem devolver token/identidade, validando expiração mesmo se timer ficou suspenso. Controller privado futuro combina esse guard com principal/geração e revisão da conexão; stores recebem guard opcional de commit imediatamente antes do swap. Guard expirado não troca cache nem transforma resultado tardio em acesso válido. Isso não habilita dados reais no Expo Go.
