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
